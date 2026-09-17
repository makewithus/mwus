import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedServerUser } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";
import { createTimelineEvent } from "@/lib/services/timeline";

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedServerUser();
    const { id } = await params;
    const { milestones } = await request.json();

    if (!Array.isArray(milestones)) {
      return NextResponse.json({ error: "Invalid milestones format" }, { status: 400 });
    }

    const projectRef = adminDb.collection("projects").doc(id);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();

    // Authorization Check: Admin OR Assigned Developer
    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden: Clients cannot update milestones" }, { status: 403 });
    }
    
    if (user.role === "developer" && (!projectData.developerIds || !projectData.developerIds.includes(user.uid))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this project" }, { status: 403 });
    }

    const previousMilestones = projectData.milestones || [];
    
    const batch = adminDb.batch();
    
    batch.update(projectRef, {
      milestones,
      updatedAt: new Date().toISOString()
    });

    // Check if any milestone status changed to create timeline events
    const timelineEvents = [];
    milestones.forEach(m => {
      const prev = previousMilestones.find(p => p.id === m.id);
      if (prev && prev.status !== m.status) {
        timelineEvents.push({
          type: "MILESTONE_UPDATED",
          title: `Milestone: ${m.title}`,
          description: `Milestone status changed to ${m.status}`,
          metadata: { milestoneId: m.id, oldStatus: prev.status, newStatus: m.status }
        });
      } else if (!prev) {
        timelineEvents.push({
          type: "MILESTONE_CREATED",
          title: `New Milestone: ${m.title}`,
          description: `A new milestone has been added.`,
          metadata: { milestoneId: m.id }
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
      action: "UPDATE_MILESTONES",
      entityType: "PROJECT",
      entityId: id,
      clientId: projectData.clientId,
      projectId: id,
      previousValue: { milestones: previousMilestones },
      newValue: { milestones },
      description: `Updated project milestones`
    });

    await batch.commit();

    return NextResponse.json({ message: "Milestones updated successfully" });
  } catch (error) {
    console.error("Error updating milestones:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
