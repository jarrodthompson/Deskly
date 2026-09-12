import { prisma } from "@/lib/prisma";
import { STATUS_ORDER, PRIORITY_ORDER, OPEN_STATUSES } from "@/lib/ticket-meta";
import type { TicketPriority, TicketStatus } from "@prisma/client";

const DONE_STATUSES: TicketStatus[] = ["RESOLVED", "CLOSED", "CANCELLED"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardData() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000);

  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      status: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
      firstRespondedAt: true,
      resolutionDueAt: true,
      resolutionSla: true,
      firstResponseSla: true,
      assignedAgentId: true,
      category: { select: { name: true } },
      assignedAgent: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const satisfactions = await prisma.customerSatisfaction.findMany({
    select: { score: true, ticketId: true },
  });

  function inRange(t: (typeof tickets)[number], from: Date, to: Date) {
    return t.createdAt >= from && t.createdAt < to;
  }

  function kpi(predicate: (t: (typeof tickets)[number]) => boolean) {
    const current = tickets.filter((t) => predicate(t) && t.createdAt >= sevenDaysAgo).length;
    const previous = tickets.filter((t) => predicate(t) && inRange(t, fourteenDaysAgo, sevenDaysAgo)).length;
    const total = tickets.filter(predicate).length;
    return { value: total, change: pctChange(current, previous), thisWeek: current };
  }

  const kpis = {
    total: kpi(() => true),
    open: kpi((t) => t.status === "OPEN"),
    new: kpi((t) => t.status === "NEW"),
    inProgress: kpi((t) => t.status === "IN_PROGRESS"),
    pending: kpi((t) => t.status === "PENDING_CUSTOMER" || t.status === "PENDING_INTERNAL" || t.status === "ON_HOLD"),
    resolved: kpi((t) => t.status === "RESOLVED"),
    closed: kpi((t) => t.status === "CLOSED"),
    unassigned: kpi((t) => !t.assignedAgentId && !DONE_STATUSES.includes(t.status)),
    overdue: kpi((t) => !!t.resolutionDueAt && t.resolutionDueAt < now && !DONE_STATUSES.includes(t.status)),
    slaBreached: kpi((t) => t.resolutionSla === "BREACHED"),
  };

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: tickets.filter((t) => t.status === status).length,
  })).filter((s) => s.count > 0);

  const byPriority = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: tickets.filter((t) => t.priority === priority).length,
  }));

  const categoryCounts = new Map<string, number>();
  for (const t of tickets) {
    const name = t.category?.name ?? "Uncategorized";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }
  const byCategory = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const days: { date: string; label: string; created: number; resolved: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 86400_000));
    const nextDay = new Date(day.getTime() + 86400_000);
    days.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      created: tickets.filter((t) => t.createdAt >= day && t.createdAt < nextDay).length,
      resolved: tickets.filter((t) => t.resolvedAt && t.resolvedAt >= day && t.resolvedAt < nextDay).length,
    });
  }

  const volumeDays: { date: string; label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 86400_000));
    const nextDay = new Date(day.getTime() + 86400_000);
    volumeDays.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: tickets.filter((t) => t.createdAt >= day && t.createdAt < nextDay).length,
    });
  }

  const responded = tickets.filter((t) => t.firstRespondedAt);
  const avgFirstResponseMs = responded.length
    ? responded.reduce((sum, t) => sum + (t.firstRespondedAt!.getTime() - t.createdAt.getTime()), 0) / responded.length
    : 0;

  const resolvedTickets = tickets.filter((t) => t.resolvedAt);
  const avgResolutionMs = resolvedTickets.length
    ? resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedTickets.length
    : 0;

  const doneTickets = tickets.filter((t) => DONE_STATUSES.includes(t.status));
  const slaCompliance = doneTickets.length
    ? Math.round((doneTickets.filter((t) => t.resolutionSla === "MET").length / doneTickets.length) * 100)
    : 100;

  const avgCsat = satisfactions.length ? satisfactions.reduce((s, c) => s + c.score, 0) / satisfactions.length : 0;

  const agentMap = new Map<string, { id: string; name: string; avatarUrl: string | null; open: number; resolved: number; csatScores: number[] }>();
  for (const t of tickets) {
    if (!t.assignedAgent) continue;
    const entry = agentMap.get(t.assignedAgent.id) ?? { id: t.assignedAgent.id, name: t.assignedAgent.name, avatarUrl: t.assignedAgent.avatarUrl, open: 0, resolved: 0, csatScores: [] as number[] };
    if (!DONE_STATUSES.includes(t.status)) entry.open++;
    if (t.status === "RESOLVED" || t.status === "CLOSED") entry.resolved++;
    agentMap.set(t.assignedAgent.id, entry);
  }
  for (const s of satisfactions) {
    const ticket = tickets.find((t) => t.id === s.ticketId);
    const agentId = ticket?.assignedAgent?.id;
    if (agentId && agentMap.has(agentId)) agentMap.get(agentId)!.csatScores.push(s.score);
  }
  const agentPerformance = [...agentMap.values()]
    .map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
      open: a.open,
      resolved: a.resolved,
      csat: a.csatScores.length ? a.csatScores.reduce((s, v) => s + v, 0) / a.csatScores.length : null,
    }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 6);

  return {
    kpis,
    byStatus,
    byPriority,
    byCategory,
    createdVsResolved: days,
    volumeOverTime: volumeDays,
    avgFirstResponseMs,
    avgResolutionMs,
    slaCompliance,
    avgCsat,
    csatCount: satisfactions.length,
    agentPerformance,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
