import { prisma } from "@/lib/prisma";
import { STATUS_ORDER, PRIORITY_ORDER } from "@/lib/ticket-meta";
import { resolveRange } from "@/lib/report-ranges";

export async function getReportData(range: string | undefined) {
  const { from, to } = resolveRange(range);

  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: {
      id: true, number: true, subject: true, status: true, priority: true, createdAt: true,
      resolvedAt: true, firstRespondedAt: true, resolutionSla: true, firstResponseSla: true, resolutionDueAt: true,
      category: { select: { name: true } },
      team: { select: { name: true } },
      assignedAgent: { select: { id: true, name: true } },
    },
  });

  const satisfactions = await prisma.customerSatisfaction.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { score: true },
  });

  const byStatus = STATUS_ORDER.map((status) => ({ status, count: tickets.filter((t) => t.status === status).length })).filter((s) => s.count > 0);
  const byPriority = PRIORITY_ORDER.map((priority) => ({ priority, count: tickets.filter((t) => t.priority === priority).length }));

  const categoryCounts = new Map<string, number>();
  for (const t of tickets) categoryCounts.set(t.category?.name ?? "Uncategorized", (categoryCounts.get(t.category?.name ?? "Uncategorized") ?? 0) + 1);
  const byCategory = [...categoryCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const teamCounts = new Map<string, number>();
  for (const t of tickets) teamCounts.set(t.team?.name ?? "Unassigned", (teamCounts.get(t.team?.name ?? "Unassigned") ?? 0) + 1);
  const byTeam = [...teamCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const agentCounts = new Map<string, number>();
  for (const t of tickets) {
    const name = t.assignedAgent?.name ?? "Unassigned";
    agentCounts.set(name, (agentCounts.get(name) ?? 0) + 1);
  }
  const byAgent = [...agentCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const responded = tickets.filter((t) => t.firstRespondedAt);
  const avgFirstResponseMs = responded.length ? responded.reduce((s, t) => s + (t.firstRespondedAt!.getTime() - t.createdAt.getTime()), 0) / responded.length : 0;

  const resolved = tickets.filter((t) => t.resolvedAt);
  const avgResolutionMs = resolved.length ? resolved.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolved.length : 0;

  const doneTickets = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
  const slaCompliance = doneTickets.length ? Math.round((doneTickets.filter((t) => t.resolutionSla === "MET").length / doneTickets.length) * 100) : 100;

  const breaches = tickets.filter((t) => t.resolutionSla === "BREACHED" || t.firstResponseSla === "BREACHED");

  const avgCsat = satisfactions.length ? satisfactions.reduce((s, c) => s + c.score, 0) / satisfactions.length : 0;

  return {
    from, to,
    total: tickets.length,
    byStatus, byPriority, byCategory, byTeam, byAgent,
    avgFirstResponseMs, avgResolutionMs, slaCompliance,
    avgCsat, csatCount: satisfactions.length,
    breaches,
  };
}
