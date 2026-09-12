import { prisma } from "@/lib/prisma";

export async function getTicketDetail(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, companyId: true } },
      company: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
      assignedAgent: { select: { id: true, name: true, avatarUrl: true } },
      team: { select: { id: true, name: true } },
      slaPolicy: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      satisfaction: true,
      mergedInto: { select: { id: true, number: true, subject: true } },
      mergedFrom: { select: { id: true, number: true, subject: true } },
      linksFrom: { include: { linkedTicket: { select: { id: true, number: true, subject: true, status: true } } } },
      linksTo: { include: { ticket: { select: { id: true, number: true, subject: true, status: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          authorUser: { select: { id: true, name: true, avatarUrl: true } },
          authorCustomer: { select: { id: true, name: true, avatarUrl: true } },
          attachments: true,
        },
      },
      notes: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          attachments: true,
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actorUser: { select: { id: true, name: true } } },
      },
      attachments: { where: { messageId: null, noteId: null } },
      customFieldValues: { include: { field: true } },
    },
  });

  if (!ticket) return null;

  const customerTicketCount = await prisma.ticket.count({ where: { customerId: ticket.customerId, id: { not: ticket.id } } });

  return { ticket, customerTicketCount };
}

export type TicketDetail = NonNullable<Awaited<ReturnType<typeof getTicketDetail>>>["ticket"];
