import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";

export async function POST(request) {
  try {
    const adminUser = await requireAdmin();
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required." },
        { status: 400 }
      );
    }

    // Per V1 scope (no email automation): generate a temp password and hand it back
    // to the admin directly, who delivers it out-of-band. Not emailed automatically.
    const randomPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    let userRecord;

    try {
      userRecord = await adminAuth.createUser({
        email,
        password: randomPassword,
        displayName: name,
      });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "A user with this email already exists." },
          { status: 400 }
        );
      }
      throw error;
    }

    try {
      const batch = adminDb.batch();
      batch.set(adminDb.collection("users").doc(userRecord.uid), {
        email,
        name,
        role: "developer",
        createdAt: new Date().toISOString(),
        status: "active",
      });
      createAuditLog(batch, {
        actorId: adminUser.uid,
        actorName: adminUser.name || adminUser.email,
        actorRole: "admin",
        action: "CREATE_DEVELOPER",
        entityType: "USER",
        entityId: userRecord.uid,
        description: `Created developer account for ${name} (${email})`,
        newValue: { email, name, role: "developer" },
      });
      await batch.commit();
    } catch (error) {
      // Roll back the auth account so a retry doesn't hit "email already exists"
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
      throw error;
    }

    return NextResponse.json({
      message: "Developer created successfully.",
      tempPassword: randomPassword,
    });
  } catch (error) {
    console.error("Error creating developer:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the developer." },
      { status: 500 }
    );
  }
}
