import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { initials } from "@/lib/utils-format";
import { formatDuration, OPEN_STATUSES } from "@/lib/ticket-meta";
import { ROLE_META, type StaffRole } from "@/lib/rbac";
import { AGENT_STATUS_META } from "@/lib/ticket-meta";
import { cn } from "cn";

export default async function AgentsPage() {
  const [agents, tickets, satisfactions] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      include: { team: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.ticket.findMany({
      select: { assignedAgentId: true, status: true, createdAt: true, resolvedAt: true, firstRespondedAt: true },
    }),
    prisma.customerSatisfaction.findMany({ select: { score: true, ticket: { select: { assignedAgentId: true } } } }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statsByAgent = new Map<string, { open: number; resolvedToday: number; responseTimes: number[]; resolutionTimes: number[] }>();
  for (const t of tickets) {
    if (!t.assignedAgentId) continue;
    const entry = statsByAgent.get(t.assignedAgentId) ?? { open: 0, resolvedToday: 0, responseTimes: [], resolutionTimes: [] };
    if (OPEN_STATUSES.includes(t.status)) entry.open++;
    if (t.resolvedAt && t.resolvedAt >= today) entry.resolvedToday++;
    if (t.firstRespondedAt) entry.responseTimes.push(t.firstRespondedAt.getTime() - t.createdAt.getTime());
    if (t.resolvedAt) entry.resolutionTimes.push(t.resolvedAt.getTime() - t.createdAt.getTime());
    statsByAgent.set(t.assignedAgentId, entry);
  }
  const csatByAgent = new Map<string, number[]>();
  for (const s of satisfactions) {
    const agentId = s.ticket.assignedAgentId;
    if (!agentId) continue;
    csatByAgent.set(agentId, [...(csatByAgent.get(agentId) ?? []), s.score]);
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{agents.length} team members</p>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Agent</th>
                <th className="px-4 py-2.5 text-left font-medium">Role</th>
                <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Team</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Open</th>
                <th className="px-4 py-2.5 text-left font-medium hidden lg:table-cell">Resolved Today</th>
                <th className="px-4 py-2.5 text-left font-medium hidden xl:table-cell">Avg Response</th>
                <th className="px-4 py-2.5 text-left font-medium hidden xl:table-cell">Avg Resolution</th>
                <th className="px-4 py-2.5 text-left font-medium">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const stats = statsByAgent.get(a.id) ?? { open: 0, resolvedToday: 0, responseTimes: [], resolutionTimes: [] };
                const csatScores = csatByAgent.get(a.id) ?? [];
                const avgResponse = stats.responseTimes.length ? stats.responseTimes.reduce((s, v) => s + v, 0) / stats.responseTimes.length : null;
                const avgResolution = stats.resolutionTimes.length ? stats.resolutionTimes.reduce((s, v) => s + v, 0) / stats.resolutionTimes.length : null;
                const avgCsat = csatScores.length ? csatScores.reduce((s, v) => s + v, 0) / csatScores.length : null;
                const statusMeta = AGENT_STATUS_META[a.status];
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/agents/${a.id}`} className="flex items-center gap-2.5 hover:underline">
                        <Avatar className="size-8">
                          <AvatarImage src={a.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(a.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{a.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{a.jobTitle ?? a.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{ROLE_META[a.roleKey as StaffRole].name}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap hidden md:table-cell text-muted-foreground">{a.team?.name ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={cn("size-1.5 rounded-full", statusMeta.className)} />
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{stats.open}</td>
                    <td className="px-4 py-2.5 tabular-nums hidden lg:table-cell">{stats.resolvedToday}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap hidden xl:table-cell text-muted-foreground">{avgResponse ? formatDuration(avgResponse) : "—"}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap hidden xl:table-cell text-muted-foreground">{avgResolution ? formatDuration(avgResolution) : "—"}</td>
                    <td className="px-4 py-2.5">
                      {avgCsat ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Star className="size-3.5 fill-current" /> {avgCsat.toFixed(1)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
