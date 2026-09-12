import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { PortalConversation } from "@/components/portal/portal-conversation";
import { ticketNumberLabel } from "@/lib/ticket-meta";

export default async function PortalTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { authorUser: { select: { name: true } }, authorCustomer: { select: { name: true } } },
      },
      satisfaction: true,
    },
  });
  if (!ticket || ticket.customerId !== session!.user.id) notFound();

  const messages = ticket.messages.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    authorType: m.authorType,
    authorName: m.authorUser?.name ?? m.authorCustomer?.name ?? "Support",
    body: m.body,
  }));

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto space-y-4">
      <Link href="/portal/tickets" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to my tickets
      </Link>
      <div>
        <div className="font-mono text-xs text-muted-foreground">{ticketNumberLabel(ticket.number)}</div>
        <h1 className="text-lg md:text-xl font-semibold tracking-tight">{ticket.subject}</h1>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
      <Card className="shadow-none">
        <CardContent className="p-5">
          <PortalConversation
            ticketId={ticket.id}
            messages={messages}
            isResolved={ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
            existingCsat={ticket.satisfaction ? { score: ticket.satisfaction.score, comment: ticket.satisfaction.comment } : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
