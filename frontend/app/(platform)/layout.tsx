import { SideNav } from "@/components/shared/side-nav";
import { TopBar } from "@/components/shared/top-bar";

const nav = [
  { label: "Dashboard", href: "/platform/dashboard" },
  { label: "Organizations", href: "/platform/organizations" },
  { label: "Plans", href: "/platform/plans" },
  { label: "Transactions", href: "/platform/transactions" },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav items={nav} title="Platform Admin" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
