"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { PRIMARY_NAV, ADMIN_NAV } from "@/lib/nav";
import { can, type StaffRole } from "@/lib/rbac";

export function MobileNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const visiblePrimary = PRIMARY_NAV.filter((item) => !item.permission || can(role, item.permission));
  const visibleAdmin = ADMIN_NAV.filter((item) => !item.permission || can(role, item.permission));

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center h-16 shrink-0 px-4 gap-2.5">
        <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <span className="font-semibold text-[15px] text-white">HelpdeskSaaS</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-6">
        <Group label="Workspace" items={visiblePrimary} pathname={pathname} />
        {visibleAdmin.length > 0 && <Group label="Administration" items={visibleAdmin} pathname={pathname} />}
      </nav>
    </div>
  );
}

function Group({ label, items, pathname }: { label: string; items: typeof PRIMARY_NAV; pathname: string }) {
  return (
    <div>
      <div className="px-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
