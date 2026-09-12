"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, HelpCircle, LifeBuoy, Settings } from "lucide-react";
import { cn } from "cn";
import { PRIMARY_NAV, ADMIN_NAV } from "@/lib/nav";
import { can, ROLE_META, type StaffRole } from "@/lib/rbac";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/layout/user-menu";

type SidebarUser = {
  name: string;
  email: string;
  image?: string | null;
  role: StaffRole;
};

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("sidebar-collapsed");
    if (stored) setCollapsed(stored === "1");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      window.localStorage.setItem("sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  }

  const visiblePrimary = PRIMARY_NAV.filter((item) => !item.permission || can(user.role, item.permission));
  const visibleAdmin = ADMIN_NAV.filter((item) => !item.permission || can(user.role, item.permission));

  return (
    <aside
      className={cn(
        "hidden md:flex h-svh sticky top-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[72px]" : "w-[264px]"
      )}
    >
      <div className={cn("flex items-center h-16 shrink-0 px-4 gap-2.5", collapsed && "justify-center px-0")}>
        <div className="size-8 shrink-0 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-[15px] tracking-tight text-white">Deskly</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-6">
        <NavGroup label={collapsed ? undefined : "Workspace"} items={visiblePrimary} pathname={pathname} collapsed={collapsed} />
        {visibleAdmin.length > 0 && (
          <NavGroup label={collapsed ? undefined : "Administration"} items={visibleAdmin} pathname={pathname} collapsed={collapsed} />
        )}
      </nav>

      <div className="px-2.5 py-2.5 border-t border-sidebar-border space-y-1">
        <SidebarLink href="/help" label="Help" icon={LifeBuoy} active={pathname.startsWith("/help")} collapsed={collapsed} />
        <SidebarLink href="/admin/settings" label="Settings" icon={Settings} active={pathname.startsWith("/admin/settings")} collapsed={collapsed} />
        <UserMenu user={user} collapsed={collapsed} />
      </div>

      <button
        onClick={toggle}
        className="absolute -right-3 top-16 size-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
      </button>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  collapsed,
}: {
  label?: string;
  items: typeof PRIMARY_NAV;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div>
      {label && (
        <div className="px-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export { SidebarLink };
