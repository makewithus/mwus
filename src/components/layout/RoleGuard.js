"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function RoleGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in
        router.replace("/login");
      } else if (!allowedRoles.includes(user.role)) {
        // Logged in but wrong role
        router.replace("/unauthorized");
      }
    }
  }, [user, loading, router, allowedRoles, pathname]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-medium">Loading session...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
