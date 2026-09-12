import Link from "next/link";
import { getReportData } from "@/lib/reports";
import { RangeSelector } from "@/components/reports/range-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDonut, PriorityBar, CategoryBar } from "@/components/dashboard/charts";
import { formatDuration, ticketNumberLabel } from "@/lib/ticket-meta";
import { StatusBadge } from "@/components/tickets/badges";
import { Clock, Timer, Gauge, Smile, ShieldAlert } from "lucide-react";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const data = await getReportData(range);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data.total} tickets created in the selected period.</p>
        </div>
        <RangeSelector />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile icon={Clock} label="Avg First Response" value={formatDuration(data.avgFirstResponseMs)} />
        <StatTile icon={Timer} label="Avg Resolution" value={formatDuration(data.avgResolutionMs)} />
        <StatTile icon={Gauge} label="SLA Compliance" value={`${data.slaCompliance}%`} />
        <StatTile icon={Smile} label="CSAT" value={data.csatCount ? `${data.avgCsat.toFixed(1)} / 5` : "—"} />
        <StatTile icon={ShieldAlert} label="SLA Breaches" value={data.breaches.length} tone="danger" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Tickets by Status</CardTitle></CardHeader>
          <CardContent>
            {data.byStatus.length > 0 ? <StatusDonut data={data.byStatus} /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Tickets by Priority</CardTitle></CardHeader>
          <CardContent>
            <PriorityBar data={data.byPriority} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Tickets by Category</CardTitle></CardHeader>
          <CardContent>
            {data.byCategory.length > 0 ? <CategoryBar data={data.byCategory} /> : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Tickets by Agent</CardTitle></CardHeader>
          <CardContent>
            {data.byAgent.length > 0 ? <CategoryBar data={data.byAgent} /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Tickets by Team</CardTitle></CardHeader>
          <CardContent>
            {data.byTeam.length > 0 ? <CategoryBar data={data.byTeam} /> : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">SLA Breaches ({data.breaches.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {data.breaches.slice(0, 10).map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticketNumberLabel(t.number)}</span>
                <span className="flex-1 min-w-0 truncate text-sm">{t.subject}</span>
                <StatusBadge status={t.status} />
              </Link>
            ))}
            {data.breaches.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No SLA breaches in this period.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; tone?: "default" | "danger" }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3.5 flex items-center gap-3">
        <div className={tone === "danger" ? "size-9 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 flex items-center justify-center shrink-0" : "size-9 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center shrink-0"}>
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-lg font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return <p className="text-sm text-muted-foreground text-center py-12">No data in this period.</p>;
}
