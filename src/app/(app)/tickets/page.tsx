import Link from "next/link";
import { Plus, Ticket as TicketIcon, FolderOpen, UserX, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getTicketListPage, getTicketStatsStrip, type TicketListParams } from "@/lib/tickets-query";
import { Button } from "@/components/ui/button";
import { InboxTabs } from "@/components/tickets/inbox-tabs";
import { FilterBar } from "@/components/tickets/filter-bar";
import { TicketTable } from "@/components/tickets/ticket-table";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) as TicketListParams;
  const session = await auth();
  const currentUserId = session!.user.id;

  const [{ tickets, total, page, pageCount, pageSize, tabCounts }, stats, agents, teams, categories] = await Promise.all([
    getTicketListPage(params, currentUserId),
    getTicketStatsStrip(),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  function buildHref(overrides: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) usp.set(k, v);
    }
    return `/tickets?${usp.toString()}`;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track every support conversation.</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/tickets/new" />}>
          <Plus className="size-4" /> Create Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={TicketIcon} label="Total Tickets" value={stats.total} />
        <StatCard icon={FolderOpen} label="Open" value={stats.open} />
        <StatCard icon={UserX} label="Unassigned" value={stats.unassigned} tone="warning" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="danger" />
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-4">
          <InboxTabs activeTab={params.tab ?? "all"} counts={tabCounts} buildHref={(tab) => buildHref({ tab: tab === "all" ? undefined : tab })} />
          <FilterBar agents={agents} teams={teams} categories={categories} />
        </CardContent>
      </Card>

      <TicketTable tickets={tickets} currentUserId={currentUserId} />

      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} buildHref={(p) => buildHref({ page: String(p) })} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone?: "default" | "warning" | "danger" }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={
          tone === "danger" ? "size-9 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 flex items-center justify-center shrink-0" :
          tone === "warning" ? "size-9 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center shrink-0" :
          "size-9 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center shrink-0"
        }>
          <Icon className="size-[18px]" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
