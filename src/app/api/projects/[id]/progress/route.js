import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedServerUser } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";
import { createTimelineEvent } from "@/lib/services/timeline";

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedServerUser();
    const { id } = await params;
    const { progress } = await request.json();

    if (progress === undefined || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "Invalid progress value. Must be between 0 and 100." }, { status: 400 });
    }

    const projectRef = adminDb.collection("projects").doc(id);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();

    // Authorization Check: Admin OR Assigned Developer
    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden: Clients cannot update progress" }, { status: 403 });
    }
    
    if (user.role === "developer" && (!projectData.developerIds || !projectData.developerIds.includes(user.uid))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this project" }, { status: 403 });
    }

    const previousProgress = projectData.progress || 0;
    
    if (progress === previousProgress) {
      return NextResponse.json({ message: "No change in progress" });
    }

    const batch = adminDb.batch();
    
    batch.update(projectRef, {
      progress,
      updatedAt: new Date().toISOString()
    });

    // Audit Log
    createAuditLog(batch, {
      actorId: user.uid,
      actorName: user.name || user.email,
      actorRole: user.role,
      action: "UPDATE_PROGRESS",
      entityType: "PROJECT",
      entityId: id,
      clientId: projectData.clientId,
      projectId: id,
      previousValue: { progress: previousProgress },
      newValue: { progress },
      description: `Updated project progress from ${previousProgress}% to ${progress}%`
    });

    // Timeline Event
    // We only create a timeline event if progress crosses a major threshold (e.g. 25, 50, 75, 100) or just unconditionally.
    // The requirement says "Updates Progress". Let's create an event.
    createTimelineEvent(batch, id, {
      type: "PROGRESS_UPDATE",
      title: "Progress Updated",
      description: `Project progress has been updated to ${progress}%.`,
      actorId: user.uid,
      actorName: user.name || user.email,
      actorRole: user.role,
      metadata: { oldProgress: previousProgress, newProgress: progress }
    });

    await batch.commit();

    return NextResponse.json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error("Error updating progress:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
