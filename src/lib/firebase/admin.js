import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Everything below runs at module import time, which Next.js does once per serverless
// invocation before any route handler's try/catch exists. If this throws directly,
// the whole function crashes and the client gets an EMPTY response body (not JSON),
// which surfaces in the browser as "Unexpected end of JSON input" instead of a
// readable error. So we catch the failure here and defer it: adminDb/adminAuth become
// proxies that throw this same error, but only when a route handler actually touches
// them inside its own try/catch — where it can be turned into a proper JSON response.
let adminDb;
let adminAuth;

try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Vercel sometimes wraps environment variables in quotes
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!getApps().length) {
    const missing = [];
    if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
    if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

    if (missing.length > 0) {
      throw new Error(
        `Firebase Admin SDK is misconfigured: missing env var(s) ${missing.join(", ")}. ` +
        `Set these in the deployment platform's environment variable settings (they are not read from .env in production).`
      );
    }

    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new Error(
        "Firebase Admin SDK is misconfigured: FIREBASE_PRIVATE_KEY does not look like a valid PEM key. " +
        "Make sure the full key (including -----BEGIN PRIVATE KEY-----/-----END PRIVATE KEY-----) was pasted, " +
        "with \\n escapes preserved, into the deployment platform's environment variables."
      );
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  adminDb = getFirestore();
  adminAuth = getAuth();
} catch (error) {
  console.error("Firebase Admin SDK failed to initialize:", error.message);
  error.isAdminConfigError = true;
  const throwConfigError = () => {
    throw error;
  };
  adminDb = new Proxy({}, { get: throwConfigError });
  adminAuth = new Proxy({}, { get: throwConfigError });
}

export { adminDb, adminAuth };
