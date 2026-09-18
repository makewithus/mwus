import { adminAuth, adminDb } from "../firebase/admin";
import { headers } from "next/headers";

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * Returns the decoded token and the user's Firestore document.
 */
export async function getAuthenticatedServerUser() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid Authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      throw new Error("Unauthorized: User profile not found");
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userDoc.data()
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    // A misconfigured Admin SDK (bad/missing env vars) is a server config problem,
    // not a bad token — don't mask it as "Unauthorized" or the real cause is lost.
    if (error.isAdminConfigError) {
      throw error;
    }
    throw new Error("Unauthorized: Invalid token");
  }
}

export async function requireAdmin() {
  const user = await getAuthenticatedServerUser();
  if (user.role !== "admin") throw new Error("Forbidden: Requires admin role");
  return user;
}

export async function requireDeveloper() {
  const user = await getAuthenticatedServerUser();
  if (user.role !== "developer" && user.role !== "admin") {
    throw new Error("Forbidden: Requires developer role");
  }
  return user;
}

export async function requireClient() {
  const user = await getAuthenticatedServerUser();
  if (user.role !== "client" && user.role !== "admin") {
    throw new Error("Forbidden: Requires client role");
  }
  return user;
}
