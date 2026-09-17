import { RoleGuard } from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const adminNavigation = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Clients", href: "/admin/clients" },
  { name: "Developers", href: "/admin/developers" },
  { name: "Projects", href: "/admin/projects" },
  { name: "Audit Log", href: "/admin/audit" },
];

export default function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col md:flex-row h-screen bg-background">
        <Sidebar items={adminNavigation} title="Admin Portal" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
