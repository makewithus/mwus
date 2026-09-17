import { adminDb } from "../firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Creates a timeline event for a project.
 */
export function createTimelineEvent(batchOrTx, projectId, data) {
  const { type, title, description, actorId, actorName, actorRole, metadata } = data;
  
  const timelineRef = adminDb.collection("projects").doc(projectId).collection("timeline").doc();
  const payload = {
    type,
    title,
    description,
    actorId,
    actorName,
    actorRole,
    metadata: metadata || null,
    createdAt: FieldValue.serverTimestamp()
  };

  if (batchOrTx) {
    batchOrTx.set(timelineRef, payload);
  } else {
    return timelineRef.set(payload);
  }
}
