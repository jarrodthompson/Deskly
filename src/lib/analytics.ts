import { prisma } from "@/lib/prisma";

export async function getAnalyticsData() {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400_000);

  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: ninetyDaysAgo } },
    select: { createdAt: true, resolvedAt: true, resolutionSla: true, status: true, assignedAgentId: true, assignedAgent: { select: { id: true, name: true, avatarUrl: true } } },
  });
  const satisfactions = await prisma.customerSatisfaction.findMany({
    where: { createdAt: { gte: ninetyDaysAgo } },
    select: { score: true, ticket: { select: { assignedAgentId: true } } },
  });

  function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  const volumeOverTime: { label: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 86400_000));
    const next = new Date(day.getTime() + 86400_000);
    volumeOverTime.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: tickets.filter((t) => t.createdAt >= day && t.createdAt < next).length,
    });
  }

  const weeklyCompliance: { label: string; compliance: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfDay(new Date(now.getTime() - i * 7 * 86400_000));
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400_000);
    const done = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= weekStart && t.resolvedAt < weekEnd && (t.status === "RESOLVED" || t.status === "CLOSED"));
    const compliance = done.length ? Math.round((done.filter((t) => t.resolutionSla === "MET").length / done.length) * 100) : 100;
    weeklyCompliance.push({ label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }), compliance });
  }

  const agentMap = new Map<string, { id: string; name: string; avatarUrl: string | null; open: number; resolved: number; csatScores: number[] }>();
  for (const t of tickets) {
    if (!t.assignedAgent) continue;
    const entry = agentMap.get(t.assignedAgent.id) ?? { id: t.assignedAgent.id, name: t.assignedAgent.name, avatarUrl: t.assignedAgent.avatarUrl, open: 0, resolved: 0, csatScores: [] as number[] };
    if (t.status !== "RESOLVED" && t.status !== "CLOSED" && t.status !== "CANCELLED") entry.open++;
    if (t.status === "RESOLVED" || t.status === "CLOSED") entry.resolved++;
    agentMap.set(t.assignedAgent.id, entry);
  }
  for (const s of satisfactions) {
    const agentId = s.ticket.assignedAgentId;
    if (agentId && agentMap.has(agentId)) agentMap.get(agentId)!.csatScores.push(s.score);
  }

  const agentLeaderboard = [...agentMap.values()]
    .map((a) => ({ id: a.id, name: a.name, avatarUrl: a.avatarUrl, open: a.open, resolved: a.resolved, csat: a.csatScores.length ? a.csatScores.reduce((s, v) => s + v, 0) / a.csatScores.length : null }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 8);

  return { volumeOverTime, weeklyCompliance, agentLeaderboard, totalTickets90d: tickets.length, totalCsat90d: satisfactions.length };
}
