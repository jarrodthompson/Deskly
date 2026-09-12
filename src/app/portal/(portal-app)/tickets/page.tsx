import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { ticketNumberLabel } from "@/lib/ticket-meta";
import { timeAgo } from "@/lib/utils-format";

export default async function PortalTicketsPage() {
  const session = await auth();
  const tickets = await prisma.ticket.findMany({
    where: { customerId: session!.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true },
  });

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">My Tickets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{tickets.length} tickets</p>
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
            {tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No tickets yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
