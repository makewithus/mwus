"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-surface px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex md:hidden items-center">
        <img src="/images/mwulogo-removebg.png" alt="MakeWithUs Logo" className="h-8 w-auto object-contain brightness-0 dark:invert" />
      </div>
      <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
        <ThemeToggle />
        
        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
        
        {/* Profile Info */}
        <div className="flex items-center gap-x-4">
          <div className="hidden sm:flex sm:flex-col sm:items-end">
            <span className="text-sm font-semibold leading-6 text-foreground" aria-hidden="true">
              {user?.email}
            </span>
            <span className="text-xs leading-5 text-muted-foreground capitalize" aria-hidden="true">
              {user?.role}
            </span>
          </div>
          <div className="h-8 w-8 rounded-none bg-foreground text-background flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
