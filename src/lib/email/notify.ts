import { prisma } from "@/lib/prisma";
import { ticketNumberLabel } from "@/lib/ticket-meta";
import { appUrl, sendEmail } from "@/lib/email/client";
import {
  agentRepliedEmail,
  customerRepliedEmail,
  ticketAssignedEmail,
  ticketCreatedEmail,
  ticketResolvedEmail,
} from "@/lib/email/templates";

const ticketSelect = {
  id: true,
  number: true,
  subject: true,
  assignedAgentId: true,
  customer: { select: { name: true, email: true } },
} as const;

async function loadTicket(ticketId: string) {
  return prisma.ticket.findUnique({ where: { id: ticketId }, select: ticketSelect });
}

function refs(ticket: { id: string; number: number; subject: string }) {
  return {
    ticketLabel: ticketNumberLabel(ticket.number),
    subject: ticket.subject,
    portalUrl: `${appUrl()}/portal/tickets/${ticket.id}`,
    staffUrl: `${appUrl()}/tickets/${ticket.id}`,
  };
}

export async function notifyTicketCreated(ticketId: string) {
  const ticket = await loadTicket(ticketId);
  if (!ticket?.customer.email) return;
  const { ticketLabel, subject, portalUrl } = refs(ticket);
  await sendEmail({
    to: ticket.customer.email,
    ...ticketCreatedEmail({ ticketLabel, subject, url: portalUrl, customerName: ticket.customer.name }),
  });
}

export async function notifyAgentReplied(ticketId: string, agentName: string, body: string) {
  const ticket = await loadTicket(ticketId);
  if (!ticket?.customer.email) return;
  const { ticketLabel, subject, portalUrl } = refs(ticket);
  await sendEmail({
    to: ticket.customer.email,
    ...agentRepliedEmail({ ticketLabel, subject, url: portalUrl, agentName, body }),
  });
}

export async function notifyCustomerReplied(ticketId: string, body: string) {
  const ticket = await loadTicket(ticketId);
  if (!ticket?.assignedAgentId) return;
  const agent = await prisma.user.findUnique({ where: { id: ticket.assignedAgentId }, select: { email: true } });
  if (!agent?.email) return;
  const { ticketLabel, subject, staffUrl } = refs(ticket);
  await sendEmail({
    to: agent.email,
    ...customerRepliedEmail({ ticketLabel, subject, url: staffUrl, customerName: ticket.customer.name, body }),
  });
}

export async function notifyTicketResolved(ticketId: string) {
  const ticket = await loadTicket(ticketId);
  if (!ticket?.customer.email) return;
  const { ticketLabel, subject, portalUrl } = refs(ticket);
  await sendEmail({ to: ticket.customer.email, ...ticketResolvedEmail({ ticketLabel, subject, url: portalUrl }) });
}

export async function notifyTicketAssigned(ticketId: string, agentId: string) {
  const [ticket, agent] = await Promise.all([
    loadTicket(ticketId),
    prisma.user.findUnique({ where: { id: agentId }, select: { name: true, email: true } }),
  ]);
  if (!ticket || !agent?.email) return;
  const { ticketLabel, subject, staffUrl } = refs(ticket);
  await sendEmail({
    to: agent.email,
    ...ticketAssignedEmail({ ticketLabel, subject, url: staffUrl, agentName: agent.name }),
  });
}
