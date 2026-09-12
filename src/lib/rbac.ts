export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEADER",
  "AGENT",
  "READ_ONLY",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_META: Record<StaffRole, { name: string; description: string }> = {
  SUPER_ADMIN: { name: "Super Admin", description: "Full system access, including danger-zone settings." },
  ADMIN: { name: "Admin", description: "Manage users, teams, tickets, SLAs and settings." },
  MANAGER: { name: "Manager", description: "Reports, team management and ticket oversight." },
  TEAM_LEADER: { name: "Team Leader", description: "Manage tickets and agents within their team." },
  AGENT: { name: "Support Agent", description: "View and manage assigned or permitted tickets." },
  READ_ONLY: { name: "Read Only", description: "View-only access across the workspace." },
};

export const PERMISSIONS = [
  { key: "tickets.view.all", category: "Tickets", description: "View every ticket in the workspace" },
  { key: "tickets.view.team", category: "Tickets", description: "View tickets assigned to their team" },
  { key: "tickets.view.assigned", category: "Tickets", description: "View tickets assigned to themselves" },
  { key: "tickets.create", category: "Tickets", description: "Create new tickets" },
  { key: "tickets.edit", category: "Tickets", description: "Edit ticket fields" },
  { key: "tickets.delete", category: "Tickets", description: "Delete tickets" },
  { key: "tickets.assign", category: "Tickets", description: "Assign tickets to agents or teams" },
  { key: "tickets.close", category: "Tickets", description: "Close or resolve tickets" },
  { key: "tickets.merge", category: "Tickets", description: "Merge or link tickets" },
  { key: "customers.manage", category: "CRM", description: "Manage customer records" },
  { key: "companies.manage", category: "CRM", description: "Manage company records" },
  { key: "agents.manage", category: "People", description: "Manage agents" },
  { key: "teams.manage", category: "People", description: "Manage teams" },
  { key: "sla.manage", category: "Operations", description: "Manage SLA policies" },
  { key: "automations.manage", category: "Operations", description: "Manage automation rules" },
  { key: "reports.view", category: "Insights", description: "View reports and analytics" },
  { key: "knowledge_base.manage", category: "Content", description: "Manage knowledge base articles" },
  { key: "admin.users", category: "Admin", description: "Manage staff users" },
  { key: "admin.roles", category: "Admin", description: "Manage roles and permissions" },
  { key: "admin.settings", category: "Admin", description: "Manage general and email settings" },
  { key: "admin.system", category: "Admin", description: "Danger-zone: org-level system settings" },
  { key: "audit_log.view", category: "Admin", description: "View the audit log" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

const ALL: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export const ROLE_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((p) => p !== "admin.system"),
  MANAGER: [
    "tickets.view.all",
    "tickets.edit",
    "tickets.assign",
    "tickets.close",
    "tickets.merge",
    "customers.manage",
    "companies.manage",
    "agents.manage",
    "teams.manage",
    "sla.manage",
    "automations.manage",
    "reports.view",
    "knowledge_base.manage",
  ],
  TEAM_LEADER: [
    "tickets.view.team",
    "tickets.create",
    "tickets.edit",
    "tickets.assign",
    "tickets.close",
    "tickets.merge",
    "customers.manage",
    "reports.view",
    "knowledge_base.manage",
  ],
  AGENT: [
    "tickets.view.assigned",
    "tickets.view.team",
    "tickets.create",
    "tickets.edit",
    "tickets.close",
    "customers.manage",
    "knowledge_base.manage",
  ],
  READ_ONLY: ["tickets.view.all", "reports.view"],
};

export function can(role: StaffRole | undefined | null, permission: PermissionKey): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: StaffRole | undefined | null, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => can(role, p));
}

export const TICKET_SCOPE_ROLES: StaffRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "READ_ONLY"];
