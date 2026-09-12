import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, Building2, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { ticketNumberLabel, formatDuration, OPEN_STATUSES } from "@/lib/ticket-meta";
import { initials, timeAgo } from "@/lib/utils-format";
import { NotesEditor } from "@/components/customers/notes-editor";
import { AccountStatusToggle } from "@/components/customers/account-status-toggle";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      tickets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true, resolvedAt: true },
      },
      satisfactions: { select: { score: true } },
    },
  });
  if (!customer) notFound();

  const total = customer.tickets.length;
  const open = customer.tickets.filter((t) => OPEN_STATUSES.includes(t.status)).length;
  const resolved = customer.tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
  const resolvedWithTime = customer.tickets.filter((t) => t.resolvedAt);
  const avgResolutionMs = resolvedWithTime.length
    ? resolvedWithTime.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedWithTime.length
    : 0;
  const avgCsat = customer.satisfactions.length ? customer.satisfactions.reduce((s, c) => s + c.score, 0) / customer.satisfactions.length : null;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Avatar className="size-14">
          <AvatarImage src={customer.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-cyan-600 text-white text-lg">{initials(customer.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{customer.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><Mail className="size-3.5" /> {customer.email}</span>
            {customer.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" /> {customer.phone}</span>}
            {customer.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {customer.location}</span>}
            {customer.company && (
              <Link href={`/companies/${customer.company.id}`} className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline">
                <Building2 className="size-3.5" /> {customer.company.name}
              </Link>
            )}
          </div>
        </div>
        <AccountStatusToggle customerId={customer.id} status={customer.accountStatus} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile label="Total Tickets" value={total} />
        <StatTile label="Open Tickets" value={open} />
        <StatTile label="Resolved" value={resolved} />
        <StatTile label="Avg Resolution" value={avgResolutionMs ? formatDuration(avgResolutionMs) : "—"} />
        <StatTile label="CSAT" value={avgCsat ? `${avgCsat.toFixed(1)} / 5` : "—"} icon={avgCsat ? Star : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Ticket History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {customer.tickets.map((t) => (
                <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                  <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticketNumberLabel(t.number)}</span>
                  <span className="flex-1 min-w-0 truncate text-sm">{t.subject}</span>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{timeAgo(t.createdAt)}</span>
                </Link>
              ))}
              {customer.tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tickets yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Notes</CardTitle></CardHeader>
          <CardContent>
            <NotesEditor customerId={customer.id} initialNotes={customer.notes ?? ""} />
          </CardContent>
        </Card>
      </div>
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
