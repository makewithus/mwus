import { AppLayout } from "@/components/layout/AppLayout";

const adminNavigation = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Clients", href: "/admin/clients" },
  { name: "Developers", href: "/admin/developers" },
  { name: "Projects", href: "/admin/projects" },
  { name: "Audit Log", href: "/admin/audit" },
];

export default function AdminLayout({ children }) {
  return (
    <AppLayout items={adminNavigation} title="Admin Portal" allowedRoles={["admin"]}>
      {children}
    </AppLayout>
  );
}
