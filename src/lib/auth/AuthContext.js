"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/client";
import { toast } from "sonner";

const AuthContext = createContext({});

// Internal business portal: require re-authentication after this much time,
// even if the browser tab is left open across a work session.
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_STORAGE_KEY = "mwu_session_started_at";
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

function isSessionExpired() {
  const startedAt = Number(window.localStorage.getItem(SESSION_STORAGE_KEY));
  // No recorded start time (e.g. a session that predates this check) counts as expired.
  if (!startedAt) return true;
  return Date.now() - startedAt > SESSION_MAX_AGE_MS;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const expiredToastShown = useRef(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (isSessionExpired()) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          setUser(null);
          setLoading(false);
          await signOut(auth);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDoc.data(),
            });
          } else {
            console.error("User document not found for:", firebaseUser.uid);
            setUser(null);
            await signOut(auth); // Force signout if no role
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Periodically check for session expiry so a long-open tab is logged out
  // without requiring a page reload.
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (isSessionExpired()) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setUser(null);
        if (!expiredToastShown.current) {
          expiredToastShown.current = true;
          toast.info("Your session has expired. Please log in again.");
        }
        if (auth) await signOut(auth);
      }
    }, SESSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    if (!auth) throw new Error("Firebase API key missing from configuration.");
    const { setPersistence, browserSessionPersistence } = await import("firebase/auth");
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    window.localStorage.setItem(SESSION_STORAGE_KEY, String(Date.now()));
    expiredToastShown.current = false;
    return result;
  };

  const logout = async () => {
    setUser(null);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    if (!auth) return;
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
