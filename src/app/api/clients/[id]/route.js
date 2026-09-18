import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";

const EDITABLE_FIELDS = ["companyName", "contactPerson", "phone", "location", "website", "notes", "clientSource", "status"];

export async function PATCH(request, { params }) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const clientRef = adminDb.collection("clients").doc(id);
    const clientSnap = await clientRef.get();

    if (!clientSnap.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const previousData = clientSnap.data();

    if (data.status !== undefined && !["active", "archived"].includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    let updates = {};
    let changesMade = false;
    let descriptionParts = [];

    for (const field of EDITABLE_FIELDS) {
      if (data[field] !== undefined && data[field] !== previousData[field]) {
        updates[field] = data[field];
        changesMade = true;
        descriptionParts.push(field === "status"
          ? `Status changed from ${previousData.status} to ${data.status}`
          : `Changed ${field}`);
      }
    }

    if (!changesMade) {
      return NextResponse.json({ message: "No changes detected" });
    }

    updates.updatedAt = new Date().toISOString();

    const batch = adminDb.batch();
    batch.update(clientRef, updates);

    createAuditLog(batch, {
      actorId: adminUser.uid,
      actorName: adminUser.name || adminUser.email,
      actorRole: "admin",
      action: "UPDATE_CLIENT",
      entityType: "CLIENT",
      entityId: id,
      clientId: id,
      previousValue: previousData,
      newValue: { ...previousData, ...updates },
      description: descriptionParts.join(", "),
    });

    await batch.commit();

    return NextResponse.json({ message: "Client updated successfully" });
  } catch (error) {
    console.error("Error updating client:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
