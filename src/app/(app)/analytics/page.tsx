import { getAnalyticsData } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VolumeChart, ComplianceTrendChart } from "@/components/dashboard/charts";
import { AgentPerformanceTable } from "@/components/dashboard/agent-performance-table";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Long-term trends over the last 90 days · {data.totalTickets90d} tickets</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Ticket Volume (90 days)</CardTitle></CardHeader>
          <CardContent>
            <VolumeChart data={data.volumeOverTime} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Agent Leaderboard</CardTitle></CardHeader>
          <CardContent>
            <AgentPerformanceTable agents={data.agentLeaderboard} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">SLA Compliance Trend (weekly)</CardTitle></CardHeader>
        <CardContent>
          <ComplianceTrendChart data={data.weeklyCompliance} />
        </CardContent>
      </Card>
    </div>
  );
}
