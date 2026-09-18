import { AppLayout } from "@/components/layout/AppLayout";

const developerNavigation = [
  { name: "My Projects", href: "/developer/dashboard" },
];

export default function DeveloperLayout({ children }) {
  return (
    <AppLayout items={developerNavigation} title="Developer Portal" allowedRoles={["developer"]}>
      {children}
    </AppLayout>
  );
}
