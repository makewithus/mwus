import { adminDb } from "../firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Creates an audit log entry.
 * Should be called inside a batch or transaction if possible, 
 * or directly if standalone.
 */
export function createAuditLog(batchOrTx, data) {
  const { actorId, actorName, actorRole, action, entityType, entityId, clientId, projectId, previousValue, newValue, description } = data;
  
  const auditRef = adminDb.collection("auditLogs").doc();
  const payload = {
    actorId,
    actorName,
    actorRole,
    action,
    entityType,
    entityId,
    clientId: clientId || null,
    projectId: projectId || null,
    previousValue: previousValue || null,
    newValue: newValue || null,
    description,
    createdAt: FieldValue.serverTimestamp()
  };

  if (batchOrTx) {
    batchOrTx.set(auditRef, payload);
  } else {
    return auditRef.set(payload);
  }
}
