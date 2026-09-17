import { RoleGuard } from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const clientNavigation = [
  { name: "My Projects", href: "/client/dashboard" },
];

export default function ClientLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["client"]}>
      <div className="flex flex-col md:flex-row h-screen bg-background">
        <Sidebar items={clientNavigation} title="Client Portal" />
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
