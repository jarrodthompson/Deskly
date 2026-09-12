import type { TicketPriority, TicketStatus, SlaState, AgentStatus } from "@prisma/client";

export const STATUS_META: Record<TicketStatus, { label: string; className: string; dot: string }> = {
  NEW: { label: "New", className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20", dot: "bg-sky-500" },
  OPEN: { label: "Open", className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20", dot: "bg-cyan-500" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20", dot: "bg-amber-500" },
  PENDING_CUSTOMER: { label: "Pending Customer", className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20", dot: "bg-violet-500" },
  PENDING_INTERNAL: { label: "Pending Internal", className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-500/20", dot: "bg-fuchsia-500" },
  ON_HOLD: { label: "On Hold", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20", dot: "bg-slate-500" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20", dot: "bg-emerald-500" },
  CLOSED: { label: "Closed", className: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", dot: "bg-slate-400" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20", dot: "bg-rose-500" },
};

export const PRIORITY_META: Record<TicketPriority, { label: string; className: string; dot: string }> = {
  LOW: { label: "Low", className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", dot: "bg-slate-400" },
  MEDIUM: { label: "Medium", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20", dot: "bg-blue-500" },
  HIGH: { label: "High", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20", dot: "bg-amber-500" },
  URGENT: { label: "Urgent", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20", dot: "bg-orange-500" },
  CRITICAL: { label: "Critical", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20", dot: "bg-red-500" },
};

export const SLA_META: Record<SlaState, { label: string; className: string }> = {
  HEALTHY: { label: "Healthy", className: "text-emerald-600 dark:text-emerald-400" },
  AT_RISK: { label: "At Risk", className: "text-amber-600 dark:text-amber-400" },
  BREACHED: { label: "Breached", className: "text-red-600 dark:text-red-400" },
  MET: { label: "Met", className: "text-emerald-600 dark:text-emerald-400" },
  PAUSED: { label: "Paused", className: "text-slate-500 dark:text-slate-400" },
};

export const AGENT_STATUS_META: Record<AgentStatus, { label: string; className: string }> = {
  ONLINE: { label: "Online", className: "bg-emerald-500" },
  BUSY: { label: "Busy", className: "bg-red-500" },
  AWAY: { label: "Away", className: "bg-amber-500" },
  OFFLINE: { label: "Offline", className: "bg-slate-400" },
};

export const STATUS_ORDER: TicketStatus[] = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "PENDING_CUSTOMER",
  "PENDING_INTERNAL",
  "ON_HOLD",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

export const PRIORITY_ORDER: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"];

export const OPEN_STATUSES: TicketStatus[] = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "PENDING_CUSTOMER",
  "PENDING_INTERNAL",
  "ON_HOLD",
];

export function ticketNumberLabel(number: number) {
  return `TKT-${number}`;
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const totalMinutes = Math.floor(abs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function slaCountdownLabel(dueAt: Date | null | undefined, state: SlaState): string {
  if (!dueAt) return "—";
  if (state === "MET") return "Met";
  if (state === "PAUSED") return "Paused";
  const diff = dueAt.getTime() - Date.now();
  if (diff <= 0) return `${formatDuration(diff)} overdue`;
  return `${formatDuration(diff)} remaining`;
}
