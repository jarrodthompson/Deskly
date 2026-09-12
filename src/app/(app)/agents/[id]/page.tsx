import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { AGENT_STATUS_META, formatDuration, ticketNumberLabel, OPEN_STATUSES } from "@/lib/ticket-meta";
import { ROLE_META, type StaffRole } from "@/lib/rbac";
import { initials, timeAgo } from "@/lib/utils-format";
import { cn } from "cn";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.user.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true } },
      assignedTickets: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true, resolvedAt: true },
      },
    },
  });
  if (!agent) notFound();

  const satisfactions = await prisma.customerSatisfaction.findMany({ where: { ticket: { assignedAgentId: agent.id } }, select: { score: true } });

  const total = agent.assignedTickets.length;
  const open = agent.assignedTickets.filter((t) => OPEN_STATUSES.includes(t.status)).length;
  const resolved = agent.assignedTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
  const resolvedWithTime = agent.assignedTickets.filter((t) => t.resolvedAt);
  const avgResolutionMs = resolvedWithTime.length
    ? resolvedWithTime.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedWithTime.length
    : 0;
  const avgCsat = satisfactions.length ? satisfactions.reduce((s, c) => s + c.score, 0) / satisfactions.length : null;
  const statusMeta = AGENT_STATUS_META[agent.status];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Avatar className="size-14">
          <AvatarImage src={agent.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-cyan-600 text-white text-lg">{initials(agent.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{agent.name}</h1>
            <span className={cn("size-2 rounded-full", statusMeta.className)} />
            <span className="text-xs text-muted-foreground">{statusMeta.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><Mail className="size-3.5" /> {agent.email}</span>
            <span>{ROLE_META[agent.roleKey as StaffRole].name}</span>
            {agent.team && <span>{agent.team.name}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile label="Total Tickets" value={total} />
        <StatTile label="Open" value={open} />
        <StatTile label="Resolved" value={resolved} />
        <StatTile label="Avg Resolution" value={avgResolutionMs ? formatDuration(avgResolutionMs) : "—"} />
        <StatTile label="CSAT" value={avgCsat ? `${avgCsat.toFixed(1)} / 5` : "—"} icon={avgCsat ? Star : undefined} />
      </div>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">Assigned Tickets</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {agent.assignedTickets.map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticketNumberLabel(t.number)}</span>
                <span className="flex-1 min-w-0 truncate text-sm">{t.subject}</span>
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{timeAgo(t.createdAt)}</span>
              </Link>
            ))}
            {agent.assignedTickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tickets assigned yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3.5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold tabular-nums flex items-center gap-1 mt-0.5">
          {Icon && <Icon className="size-4 text-amber-500 fill-current" />}
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
