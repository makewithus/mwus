import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

let app = null;
let auth = null;
let db = null;

if (firebaseConfig.apiKey) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  if (typeof window !== "undefined") {
    console.error(
      "=========================================\n" +
      "⚠️ FIREBASE API KEY MISSING ⚠️\n" +
      "Next.js is using a dummy fallback config.\n" +
      "Authentication WILL fail.\n" +
      "Please check your .env.local file.\n" +
      "========================================="
    );
  }
}

export { app, auth, db };
