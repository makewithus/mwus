import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";

export async function POST(request) {
  try {
    const adminUser = await requireAdmin();
    const data = await request.json();

    // Validate required fields (per CTO V1 doc: company name, contact person, email, phone, location are required)
    if (!data.companyName || !data.email || !data.contactPerson || !data.phone || !data.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the client's portal login (Firebase Auth) with a random placeholder password.
    // They will set their own password via the emailed reset link, same as the developer invite flow.
    const randomPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: data.email,
        password: randomPassword,
        displayName: data.contactPerson,
      });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
      }
      throw error;
    }

    // 2. Create the client + linked user docs (kept atomic so portal access always matches the client record)
    const batch = adminDb.batch();

    const clientRef = adminDb.collection("clients").doc();
    const clientData = {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      location: data.location,
      website: data.website || null,
      notes: data.notes || null,
      clientSource: data.clientSource || null,
      status: "active",
      portalUserId: userRecord.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminUser.uid,
    };
    batch.set(clientRef, clientData);

    batch.set(adminDb.collection("users").doc(userRecord.uid), {
      email: data.email,
      name: data.contactPerson,
      role: "client",
      clientId: clientRef.id,
      createdAt: new Date().toISOString(),
      status: "active",
    });

    // 3. Generate Audit Log
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

    try {
      await batch.commit();
    } catch (error) {
      // Roll back the auth account so a retry doesn't hit "email already exists"
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
      throw error;
    }

    // Per V1 scope (no email automation): the temp password is returned directly to the
    // admin to hand off out-of-band (verbally, chat, etc.), not emailed automatically.
    return NextResponse.json({
      message: "Client created successfully",
      id: clientRef.id,
      client: clientData,
      tempPassword: randomPassword,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
