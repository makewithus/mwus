import { RoleGuard } from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const developerNavigation = [
  { name: "My Projects", href: "/developer/dashboard" },
];

export default function DeveloperLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["developer"]}>
      <div className="flex flex-col md:flex-row h-screen bg-background">
        <Sidebar items={developerNavigation} title="Developer Portal" />
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
