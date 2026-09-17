"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/styles";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { User, LogOut } from "lucide-react";

export function Sidebar({ items = [], title = "Portal" }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-surface flex md:flex-col shrink-0 overflow-x-auto md:overflow-x-visible">
      <div className="hidden md:flex h-16 items-center justify-center border-b border-border px-6 shrink-0">
        <img src="/images/mwulogo-removebg.png" alt="MakeWithUs Logo" className="h-10 w-auto object-contain brightness-0 dark:invert" />
      </div>
      <nav className="flex md:flex-col md:flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1 overflow-y-auto whitespace-nowrap">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
