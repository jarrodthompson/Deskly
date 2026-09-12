import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils-format";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actorUser: { select: { name: true } }, actorCustomer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System activity across users, tickets, roles and settings.</p>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Actor</th>
                <th className="px-4 py-2.5 text-left font-medium">Action</th>
                <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Entity</th>
                <th className="px-4 py-2.5 text-left font-medium hidden lg:table-cell">IP</th>
                <th className="px-4 py-2.5 text-left font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 whitespace-nowrap">{log.actorUser?.name ?? log.actorCustomer?.name ?? "System"}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline" className="font-mono text-[11px]">{log.action}</Badge></td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell font-mono text-xs">{log.ipAddress ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No activity recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
