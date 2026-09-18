import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";
import { createTimelineEvent } from "@/lib/services/timeline";

export async function PATCH(request, { params }) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const projectRef = adminDb.collection("projects").doc(id);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const previousData = projectSnap.data();
    const allowedFields = ["status", "health", "developerIds", "startDate", "expectedDeliveryDate", "description", "name", "archived"];

    let updates = {};
    let changesMade = false;
    let descriptionParts = [];

    // Resolve developer names for a readable "Unassigned -> Rahul" style description,
    // matching the audit log examples in the functional doc, instead of raw UIDs.
    let developerNamesById = null;
    if (data.developerIds !== undefined && JSON.stringify(data.developerIds) !== JSON.stringify(previousData.developerIds || [])) {
      const allDevIds = [...new Set([...(previousData.developerIds || []), ...(data.developerIds || [])])];
      const devDocs = await Promise.all(allDevIds.map(uid => adminDb.collection("users").doc(uid).get()));
      developerNamesById = {};
      devDocs.forEach(d => { if (d.exists) developerNamesById[d.id] = d.data().name || d.data().email; });
    }

    for (const field of allowedFields) {
      if (data[field] !== undefined && JSON.stringify(data[field]) !== JSON.stringify(previousData[field])) {
        updates[field] = data[field];
        changesMade = true;

        if (field === "developerIds") {
          const oldNames = (previousData.developerIds || []).map(id => developerNamesById[id] || id);
          const newNames = (data.developerIds || []).map(id => developerNamesById[id] || id);
          descriptionParts.push(`Developer assignment: ${oldNames.length ? oldNames.join(", ") : "Unassigned"} → ${newNames.length ? newNames.join(", ") : "Unassigned"}`);
        } else if (field === "expectedDeliveryDate") {
          const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "Not set";
          descriptionParts.push(`Delivery date: ${fmt(previousData.expectedDeliveryDate)} → ${fmt(data.expectedDeliveryDate)}`);
        } else if (field === "archived") {
          descriptionParts.push(data.archived ? "Project archived" : "Project restored");
        } else {
          descriptionParts.push(`Changed ${field}`);
        }
      }
    }

    if (!changesMade) {
      return NextResponse.json({ message: "No changes detected" });
    }

    updates.updatedAt = new Date().toISOString();

    const batch = adminDb.batch();
    batch.update(projectRef, updates);

    // 1. Audit Log
    createAuditLog(batch, {
      actorId: adminUser.uid,
      actorName: adminUser.name || adminUser.email,
      actorRole: "admin",
      action: "UPDATE_PROJECT",
      entityType: "PROJECT",
      entityId: id,
      clientId: previousData.clientId,
      projectId: id,
      previousValue: previousData,
      newValue: { ...previousData, ...updates },
      description: `Updated project: ${descriptionParts.join(", ")}`
    });

    // 2. Timeline Events for specific important fields
    if (updates.status && updates.status !== previousData.status) {
      createTimelineEvent(batch, id, {
        type: "STATUS_CHANGE",
        title: "Project Status Updated",
        description: `Status changed from ${previousData.status} to ${updates.status}`,
        actorId: adminUser.uid,
        actorName: adminUser.name || adminUser.email,
        actorRole: "admin",
        metadata: { oldStatus: previousData.status, newStatus: updates.status }
      });
    }

    if (updates.health && updates.health !== previousData.health) {
      createTimelineEvent(batch, id, {
        type: "HEALTH_CHANGE",
        title: "Project Health Updated",
        description: `Health status changed to ${updates.health.replace('_', ' ')}`,
        actorId: adminUser.uid,
        actorName: adminUser.name || adminUser.email,
        actorRole: "admin",
        metadata: { oldHealth: previousData.health, newHealth: updates.health }
      });
    }

    if (updates.developerIds !== undefined) {
      const oldNames = (previousData.developerIds || []).map(id => developerNamesById[id] || id);
      const newNames = (updates.developerIds || []).map(id => developerNamesById[id] || id);
      createTimelineEvent(batch, id, {
        type: "DEVELOPER_ASSIGNED",
        title: "Developer Assignment Updated",
        description: `${oldNames.length ? oldNames.join(", ") : "Unassigned"} → ${newNames.length ? newNames.join(", ") : "Unassigned"}`,
        actorId: adminUser.uid,
        actorName: adminUser.name || adminUser.email,
        actorRole: "admin",
        metadata: { oldDeveloperIds: previousData.developerIds || [], newDeveloperIds: updates.developerIds }
      });
    }

    await batch.commit();

    return NextResponse.json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
