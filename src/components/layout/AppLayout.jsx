"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppLayout({ children, items, title, allowedRoles }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="flex h-screen bg-background overflow-hidden relative">
        <Sidebar items={items} title={title} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex flex-1 flex-col overflow-hidden w-full">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
