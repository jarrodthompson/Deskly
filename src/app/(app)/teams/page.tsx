import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { initials } from "@/lib/utils-format";
import { OPEN_STATUSES } from "@/lib/ticket-meta";

export default async function TeamsPage() {
  const [teams, openCounts] = await Promise.all([
    prisma.team.findMany({
      include: { members: { select: { id: true, name: true, avatarUrl: true } }, _count: { select: { tickets: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.ticket.groupBy({ by: ["teamId", "status"], _count: true }),
  ]);

  const openByTeam = new Map<string, number>();
  for (const row of openCounts) {
    if (row.teamId && OPEN_STATUSES.includes(row.status)) {
      openByTeam.set(row.teamId, (openByTeam.get(row.teamId) ?? 0) + row._count);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teams.length} teams</p>
        </div>
        <CreateTeamDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
          <Card className="shadow-none h-full hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div>
                <div className="font-medium">{team.name}</div>
                {team.description && <div className="text-xs text-muted-foreground mt-0.5">{team.description}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/50 py-1.5">
                  <div className="font-semibold text-sm tabular-nums">{openByTeam.get(team.id) ?? 0}</div>
                  <div className="text-muted-foreground">Open</div>
                </div>
                <div className="rounded-lg bg-muted/50 py-1.5">
                  <div className="font-semibold text-sm tabular-nums">{team._count.tickets}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">{team.members.length} member{team.members.length === 1 ? "" : "s"}</div>
                <div className="flex -space-x-2">
                  {team.members.slice(0, 6).map((m) => (
                    <Avatar key={m.id} className="size-7 border-2 border-background">
                      <AvatarImage src={m.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-cyan-600 text-white text-[10px]">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length === 0 && <span className="text-xs text-muted-foreground">No members yet</span>}
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
