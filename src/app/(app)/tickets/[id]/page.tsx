import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTicketDetail } from "@/lib/ticket-detail";
import { TicketWorkspace } from "@/components/tickets/detail/ticket-workspace";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTicketDetail(id);
  if (!result) notFound();

  const [agents, teams, allTags, customFields] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customFieldDefinition.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <TicketWorkspace
      ticket={result.ticket}
      customerTicketCount={result.customerTicketCount}
      agents={agents}
      teams={teams}
      allTags={allTags}
      customFields={customFields}
    />
  );
}
