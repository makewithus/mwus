import { AppLayout } from "@/components/layout/AppLayout";

const clientNavigation = [
  { name: "My Projects", href: "/client/dashboard" },
];

export default function ClientLayout({ children }) {
  return (
    <AppLayout items={clientNavigation} title="Client Portal" allowedRoles={["client"]}>
      {children}
    </AppLayout>
  );
}
