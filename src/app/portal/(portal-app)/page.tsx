import Link from "next/link";
import { FolderOpen, Hourglass, CheckCircle2, Plus } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { ticketNumberLabel, OPEN_STATUSES } from "@/lib/ticket-meta";
import { timeAgo } from "@/lib/utils-format";

export default async function PortalDashboardPage() {
  const session = await auth();
  const customer = await prisma.customer.findUnique({ where: { id: session!.user.id } });
  const tickets = await prisma.ticket.findMany({
    where: { customerId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true },
  });

  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status)).length;
  const pending = tickets.filter((t) => t.status === "PENDING_CUSTOMER" || t.status === "PENDING_INTERNAL").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Hi, {customer?.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s the status of your support requests.</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/portal/tickets/new" />}>
          <Plus className="size-4" /> Submit Ticket
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={FolderOpen} label="Open" value={open} />
        <StatTile icon={Hourglass} label="Pending" value={pending} />
        <StatTile icon={CheckCircle2} label="Resolved" value={resolved} />
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="divide-y">
            {tickets.map((t) => (
              <Link key={t.id} href={`/portal/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticketNumberLabel(t.number)}</span>
                <span className="flex-1 min-w-0 truncate text-sm">{t.subject}</span>
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{timeAgo(t.createdAt)}</span>
              </Link>
            ))}
            {tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">You haven&apos;t submitted any tickets yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center shrink-0">
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
