import { SideNav } from "@/components/shared/side-nav";
import { TopBar } from "@/components/shared/top-bar";

const nav = [
  { label: "Dashboard", href: "/org/dashboard" },
  { label: "Profile", href: "/org/profile" },
  { label: "Members", href: "/org/members" },
  { label: "Subscription", href: "/org/subscription" },
  { label: "Billing", href: "/org/billing" },
  { label: "Transactions", href: "/org/transactions" },
];

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav items={nav} title="Org Admin" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
