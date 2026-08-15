import { SideNav } from "@/components/shared/side-nav";
import { TopBar } from "@/components/shared/top-bar";

const nav = [
  { label: "My Profile", href: "/me/profile" },
  { label: "Org Info", href: "/me/org-info" },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav items={nav} title="My Account" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
