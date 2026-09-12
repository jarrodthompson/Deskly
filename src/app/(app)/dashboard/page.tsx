import Link from "next/link";
import {
  Ticket as TicketIcon,
  FolderOpen,
  Sparkles,
  Loader,
  Hourglass,
  CheckCircle2,
  Archive,
  UserX,
  AlertTriangle,
  ShieldAlert,
  Plus,
  Timer,
  Gauge,
  Smile,
  Clock,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusDonut, PriorityBar, CategoryBar, CreatedVsResolvedChart, VolumeChart } from "@/components/dashboard/charts";
import { AgentPerformanceTable } from "@/components/dashboard/agent-performance-table";
import { STATUS_META } from "@/lib/ticket-meta";
import { formatDuration } from "@/lib/ticket-meta";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{getGreeting()}, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s an overview of your support operation today.</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0" nativeButton={false} render={<Link href="/tickets/new" />}>
          <Plus className="size-4" />
          Create Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Tickets" value={data.kpis.total.value} change={data.kpis.total.change} icon={TicketIcon} />
        <KpiCard label="Open" value={data.kpis.open.value} change={data.kpis.open.change} icon={FolderOpen} />
        <KpiCard label="New" value={data.kpis.new.value} change={data.kpis.new.change} icon={Sparkles} />
        <KpiCard label="In Progress" value={data.kpis.inProgress.value} change={data.kpis.inProgress.change} icon={Loader} />
        <KpiCard label="Pending" value={data.kpis.pending.value} change={data.kpis.pending.change} icon={Hourglass} />
        <KpiCard label="Resolved" value={data.kpis.resolved.value} change={data.kpis.resolved.change} icon={CheckCircle2} />
        <KpiCard label="Closed" value={data.kpis.closed.value} change={data.kpis.closed.change} icon={Archive} />
        <KpiCard label="Unassigned" value={data.kpis.unassigned.value} change={data.kpis.unassigned.change} icon={UserX} tone="warning" invertTrendColor />
        <KpiCard label="Overdue" value={data.kpis.overdue.value} change={data.kpis.overdue.change} icon={AlertTriangle} tone="danger" invertTrendColor />
        <KpiCard label="SLA Breached" value={data.kpis.slaBreached.value} change={data.kpis.slaBreached.change} icon={ShieldAlert} tone="danger" invertTrendColor />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={data.byStatus} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              {data.byStatus.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5 text-xs">
                  <span className={`size-2 rounded-full shrink-0 ${STATUS_META[s.status].dot}`} />
                  <span className="text-muted-foreground truncate">{STATUS_META[s.status].label}</span>
                  <span className="ml-auto font-medium tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <PriorityBar data={data.byPriority} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBar data={data.byCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Clock} label="Avg First Response" value={formatDuration(data.avgFirstResponseMs)} />
        <StatTile icon={Timer} label="Avg Resolution Time" value={formatDuration(data.avgResolutionMs)} />
        <StatTile icon={Gauge} label="SLA Compliance" value={`${data.slaCompliance}%`} />
        <StatTile icon={Smile} label="Customer Satisfaction" value={data.csatCount ? `${data.avgCsat.toFixed(1)} / 5` : "—"} sub={data.csatCount ? `${data.csatCount} responses` : "No responses yet"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets Created vs Resolved (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatedVsResolvedChart data={data.createdVsResolved} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentPerformanceTable agents={data.agentPerformance} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Ticket Volume Over Time (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <VolumeChart data={data.volumeOverTime} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center shrink-0">
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-lg font-semibold tabular-nums leading-tight">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
