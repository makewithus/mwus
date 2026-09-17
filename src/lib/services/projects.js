import { db } from "../firebase/client";
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";

export async function getProjects() {
  const q = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getProjectsByDeveloper(developerId) {
  const q = query(
    collection(db, "projects"), 
    where("developerIds", "array-contains", developerId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
}

export async function getProjectsByClient(clientId) {
  const q = query(
    collection(db, "projects"), 
    where("clientId", "==", clientId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return docs.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
}

export async function createProject(data) {
  const ref = doc(collection(db, "projects"));
  const payload = {
    ...data,
    progress: 0,
    status: data.status || 'onboarding',
    health: data.health || 'on_track',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function updateProject(id, data) {
  const ref = doc(db, "projects", id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}
