import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  Headset,
  UsersRound,
  BookOpen,
  BarChart3,
  LineChart,
  Timer,
  Zap,
  Bell,
  UserCog,
  ShieldCheck,
  Tags,
  SlidersHorizontal,
  Mail,
  Plug,
  Settings,
  History,
} from "lucide-react";
import type { PermissionKey } from "@/lib/rbac";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Customers", href: "/customers", icon: Users, permission: "customers.manage" },
  { label: "Companies", href: "/companies", icon: Building2, permission: "companies.manage" },
  { label: "Agents", href: "/agents", icon: Headset, permission: "agents.manage" },
  { label: "Teams", href: "/teams", icon: UsersRound, permission: "teams.manage" },
  { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports.view" },
  { label: "Analytics", href: "/analytics", icon: LineChart, permission: "reports.view" },
  { label: "SLA Management", href: "/sla", icon: Timer, permission: "sla.manage" },
  { label: "Automations", href: "/automations", icon: Zap, permission: "automations.manage" },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Users", href: "/admin/users", icon: UserCog, permission: "admin.users" },
  { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck, permission: "admin.roles" },
  { label: "Ticket Categories", href: "/admin/categories", icon: Tags, permission: "admin.settings" },
  { label: "Custom Fields", href: "/admin/custom-fields", icon: SlidersHorizontal, permission: "admin.settings" },
  { label: "Email Settings", href: "/admin/email-settings", icon: Mail, permission: "admin.settings" },
  { label: "Integrations", href: "/admin/integrations", icon: Plug, permission: "admin.settings" },
  { label: "General Settings", href: "/admin/settings", icon: Settings, permission: "admin.settings" },
  { label: "Audit Log", href: "/admin/audit-log", icon: History, permission: "audit_log.view" },
];
