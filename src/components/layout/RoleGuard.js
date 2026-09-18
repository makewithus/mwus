"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const HARD_REDIRECT_TIMEOUT_MS = 4000;

export function RoleGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirectTarget, setRedirectTarget] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setRedirectTarget("/login");
      router.replace("/login");
    } else if (!allowedRoles.includes(user.role)) {
      setRedirectTarget("/unauthorized");
      router.replace("/unauthorized");
    } else {
      setRedirectTarget(null);
    }
  }, [user, loading, router, allowedRoles]);

  // Safety net: a client-side redirect can stall in production (a slow/dropped connection
  // failing to fetch the target route's chunk) and leave the user on a blank screen
  // indefinitely, with router.replace() never actually completing. If we're still on this
  // page a few seconds after starting a redirect, stop waiting on the SPA router and force
  // a full page navigation instead - that only needs a plain document load to succeed.
  useEffect(() => {
    if (!redirectTarget) return;
    const timeout = setTimeout(() => {
      toast.error("Connection issue - redirecting you now.");
      window.location.href = redirectTarget;
    }, HARD_REDIRECT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [redirectTarget]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-medium">Loading session...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-medium text-muted-foreground">Redirecting...</div>;
  }

  return <>{children}</>;
}
