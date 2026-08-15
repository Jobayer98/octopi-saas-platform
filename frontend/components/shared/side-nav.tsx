"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem { label: string; href: string }

export function SideNav({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r min-h-screen p-4 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 px-2">{title}</p>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
            pathname === item.href && "bg-accent font-medium"
          )}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
