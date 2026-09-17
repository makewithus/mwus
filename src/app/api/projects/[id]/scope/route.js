import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";
import { createTimelineEvent } from "@/lib/services/timeline";

export async function PATCH(request, { params }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const { scope } = await request.json();

    if (!Array.isArray(scope)) {
      return NextResponse.json({ error: "Invalid scope format" }, { status: 400 });
    }

    const projectRef = adminDb.collection("projects").doc(id);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();
    const previousScope = projectData.scope || [];
    
    const batch = adminDb.batch();
    
    batch.update(projectRef, {
      scope,
      updatedAt: new Date().toISOString()
    });

    // Check if any scope item changed to create timeline events
    const timelineEvents = [];
    scope.forEach(s => {
      const prev = previousScope.find(p => p.id === s.id);
      if (prev && prev.status !== s.status) {
        timelineEvents.push({
          type: "SCOPE_UPDATED",
          title: `Scope Item: ${s.title}`,
          description: `Scope item status changed to ${s.status}`,
          metadata: { scopeId: s.id, oldStatus: prev.status, newStatus: s.status }
        });
      } else if (!prev) {
        timelineEvents.push({
          type: "SCOPE_ADDED",
          title: `New Scope Item: ${s.title}`,
          description: `A new scope item has been added.`,
          metadata: { scopeId: s.id }
        });
      }
    });

    timelineEvents.forEach(evt => {
      createTimelineEvent(batch, id, {
        ...evt,
        actorId: user.uid,
        actorName: user.name || user.email,
        actorRole: user.role
      });
    });

    // Audit Log
    createAuditLog(batch, {
      actorId: user.uid,
      actorName: user.name || user.email,
      actorRole: user.role,
      action: "UPDATE_SCOPE",
      entityType: "PROJECT",
      entityId: id,
      clientId: projectData.clientId,
      projectId: id,
      previousValue: { scope: previousScope },
      newValue: { scope },
      description: `Updated project scope`
    });

    await batch.commit();

    return NextResponse.json({ message: "Scope updated successfully" });
  } catch (error) {
    console.error("Error updating scope:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
