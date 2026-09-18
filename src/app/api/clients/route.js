import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";

export async function POST(request) {
  try {
    const adminUser = await requireAdmin();
    const data = await request.json();
    
    // Validate required fields
    if (!data.companyName || !data.email || !data.contactPerson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const batch = adminDb.batch();
    
    // 1. Create client doc
    const clientRef = adminDb.collection("clients").doc();
    const clientData = {
      ...data,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminUser.uid,
    };
    batch.set(clientRef, clientData);

    // 2. Generate Audit Log
    createAuditLog(batch, {
      actorId: adminUser.uid,
      actorName: adminUser.name || adminUser.email,
      actorRole: "admin",
      action: "CREATE_CLIENT",
      entityType: "CLIENT",
      entityId: clientRef.id,
      clientId: clientRef.id,
      description: `Created client account for ${clientData.companyName}`,
      newValue: clientData
    });

    await batch.commit();

    return NextResponse.json({ message: "Client created successfully", id: clientRef.id, client: clientData });
  } catch (error) {
    console.error("Error creating client:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
