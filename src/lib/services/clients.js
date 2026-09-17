import { db } from "../firebase/client";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

export async function getClients() {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createClient(data) {
  const ref = doc(collection(db, "clients"));
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function updateClient(id, data) {
  const ref = doc(db, "clients", id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return { id, ...payload };
}
