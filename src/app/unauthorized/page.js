"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-background">
      <h1 className="text-2xl font-semibold text-foreground">Unauthorized Access</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {user 
          ? `Your account (${user.email}) does not have permission to view this page.` 
          : "You do not have permission to view this page."}
      </p>
      <button 
        onClick={handleSignOut}
        className="mt-4 px-4 py-2 bg-foreground text-background rounded-none text-sm font-medium hover:bg-foreground/90 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
