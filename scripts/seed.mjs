import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Note: To run this, you must have FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

async function clearCollection(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared collection: ${collectionPath}`);
}

async function seed() {
  try {
    console.log("Starting seed process...");
    
    // Clear existing data (optional, but good for clean dev environment)
    await clearCollection("users");
    await clearCollection("clients");
    await clearCollection("projects");
    await clearCollection("auditLogs");

    // 1. Create Users in Firebase Auth & Firestore
    const usersToCreate = [
      { email: "admin@example.com", password: "password123", role: "admin", name: "Admin User" },
      { email: "developer1@example.com", password: "password123", role: "developer", name: "Rahul Dev" },
      { email: "client1@example.com", password: "password123", role: "client", name: "Acme Corp Contact" }
    ];

    const createdUsers = {};

    for (const u of usersToCreate) {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        await auth.updateUser(userRecord.uid, { password: u.password });
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: u.name,
          });
        } else {
          throw e;
        }
      }
      
      createdUsers[u.role] = userRecord;
      
      await db.collection("users").doc(userRecord.uid).set({
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    }

    // 2. Create Client Record
    const clientRef = db.collection("clients").doc();
    await clientRef.set({
      companyName: "Acme Corp",
      contactPerson: "Jane Doe",
      email: "client1@example.com",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
    });
    
    // Link client user to clientId
    await db.collection("users").doc(createdUsers.client.uid).update({
      clientId: clientRef.id
    });
    console.log(`Created client record: Acme Corp`);

    // 3. Create Project
    const projectRef = db.collection("projects").doc();
    await projectRef.set({
      name: "Acme Website Redesign",
      clientId: clientRef.id,
      developerIds: [createdUsers.developer.uid],
      description: "A complete overhaul of the corporate website.",
      status: "in_progress",
      health: "on_track",
      progress: 35,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Created project: Acme Website Redesign`);

    console.log("Seed process completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seed:", error);
    process.exit(1);
  }
}

seed();
