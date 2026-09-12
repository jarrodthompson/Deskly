import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamInfoEditor } from "@/components/teams/team-info-editor";
import { TeamMembersManager } from "@/components/teams/team-members-manager";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { ticketNumberLabel } from "@/lib/ticket-meta";
import { timeAgo } from "@/lib/utils-format";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [team, allUsers] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      include: {
        members: { select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true } },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true },
        },
        _count: { select: { tickets: true } },
      },
    }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true, teamId: true }, orderBy: { name: "asc" } }),
  ]);
  if (!team) notFound();

  const availableUsers = allUsers.filter((u) => u.teamId !== team.id);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{team.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{team.members.length} members · {team._count.tickets} total tickets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Recent Tickets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {team.tickets.map((t) => (
                <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                  <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticketNumberLabel(t.number)}</span>
                  <span className="flex-1 min-w-0 truncate text-sm">{t.subject}</span>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{timeAgo(t.createdAt)}</span>
                </Link>
              ))}
              {team.tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tickets yet.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-sm font-medium">Team Info</CardTitle></CardHeader>
            <CardContent>
              <TeamInfoEditor teamId={team.id} name={team.name} description={team.description} />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-sm font-medium">Members</CardTitle></CardHeader>
            <CardContent>
              <TeamMembersManager teamId={team.id} members={team.members} availableUsers={availableUsers} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
