import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedServerUser } from "@/lib/auth/server";
import { createAuditLog } from "@/lib/services/audit";
import { createTimelineEvent } from "@/lib/services/timeline";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedServerUser();
    const { id } = await params;
    const { content, visibility } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Update content is required" }, { status: 400 });
    }

    if (!['internal', 'client'].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }

    const projectRef = adminDb.collection("projects").doc(id);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();

    // Authorization Check: Admin OR Assigned Developer
    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden: Clients cannot post project updates" }, { status: 403 });
    }
    
    if (user.role === "developer" && (!projectData.developerIds || !projectData.developerIds.includes(user.uid))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this project" }, { status: 403 });
    }

    const batch = adminDb.batch();
    
    // Create the update document in the subcollection
    const updateRef = projectRef.collection("updates").doc();
    const updateData = {
      content,
      visibility,
      authorId: user.uid,
      authorName: user.name || user.email,
      authorRole: user.role,
      createdAt: FieldValue.serverTimestamp()
    };
    batch.set(updateRef, updateData);

    // Audit Log
    createAuditLog(batch, {
      actorId: user.uid,
      actorName: user.name || user.email,
      actorRole: user.role,
      action: "POST_UPDATE",
      entityType: "PROJECT_UPDATE",
      entityId: updateRef.id,
      clientId: projectData.clientId,
      projectId: id,
      newValue: updateData,
      description: `Posted a new ${visibility} update on project`
    });

    // Timeline Event ONLY if it's a client update
    if (visibility === 'client') {
      createTimelineEvent(batch, id, {
        type: "PROJECT_UPDATE",
        title: "New Project Update",
        description: content,
        actorId: user.uid,
        actorName: user.name || user.email,
        actorRole: user.role,
        metadata: { updateId: updateRef.id }
      });
    }

    await batch.commit();

    return NextResponse.json({ message: "Update posted successfully", id: updateRef.id });
  } catch (error) {
    console.error("Error posting update:", error);
    if (error.message.startsWith("Forbidden") || error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
