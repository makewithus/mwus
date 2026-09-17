import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";
import { createTimelineEvent } from "@/lib/services/timeline";

export async function POST(request) {
  try {
    const adminUser = await requireAdmin();
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.clientId) {
      return NextResponse.json({ error: "Missing project name or client ID" }, { status: 400 });
    }

    const batch = adminDb.batch();
    
    // 1. Create project doc
    const projectRef = adminDb.collection("projects").doc();
    const projectData = {
      ...data,
      progress: 0,
      status: data.status || 'onboarding',
      health: data.health || 'on_track',
      developerIds: data.developerIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminUser.uid,
    };
    batch.set(projectRef, projectData);

    // 2. Generate Audit Log
    createAuditLog(batch, {
      actorId: adminUser.uid,
      actorName: adminUser.name || adminUser.email,
      actorRole: "admin",
      action: "CREATE_PROJECT",
      entityType: "PROJECT",
      entityId: projectRef.id,
      clientId: projectData.clientId,
      projectId: projectRef.id,
      description: `Created project: ${projectData.name}`,
      newValue: projectData
    });

    // 3. Generate Timeline Event
    createTimelineEvent(batch, projectRef.id, {
      type: "PROJECT_CREATED",
      title: "Project Initialized",
      description: "Project setup has been completed and tracking has started.",
      actorId: adminUser.uid,
      actorName: adminUser.name || adminUser.email,
      actorRole: "admin",
      metadata: { status: projectData.status }
    });

    await batch.commit();

    return NextResponse.json({ message: "Project created successfully", id: projectRef.id, project: projectData });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
