"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { computeDueDates, findRule } from "@/lib/sla";
import { runAutomationsForNewTicket } from "@/lib/automation-engine";
import { notifyCustomerReplied, notifyTicketCreated } from "@/lib/email/notify";
import type { TicketPriority } from "@prisma/client";

async function requireCustomerSession() {
  const session = await auth();
  if (!session || session.user.kind !== "customer") throw new Error("Not authenticated");
  return session;
}

export async function submitPortalTicket(input: { subject: string; description: string; categoryId?: string | null; priority?: TicketPriority }) {
  const session = await requireCustomerSession();
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: session.user.id } });
  const company = customer.companyId ? await prisma.company.findUnique({ where: { id: customer.companyId } }) : null;

  const slaPolicy = company?.slaPolicyId
    ? await prisma.sLAPolicy.findUnique({ where: { id: company.slaPolicyId }, include: { rules: true } })
    : await prisma.sLAPolicy.findFirst({ where: { isDefault: true }, include: { rules: true } });

  const now = new Date();
  const priority = input.priority ?? "MEDIUM";
  const rule = slaPolicy ? findRule(slaPolicy.rules, priority) : undefined;
  const { firstResponseDueAt, resolutionDueAt } = computeDueDates(rule, now);

  const ticket = await prisma.ticket.create({
    data: {
      subject: input.subject,
      description: input.description,
      priority,
      status: "NEW",
      source: "PORTAL",
      customerId: customer.id,
      companyId: customer.companyId,
      categoryId: input.categoryId || null,
      slaPolicyId: slaPolicy?.id ?? null,
      firstResponseDueAt,
      resolutionDueAt,
    },
  });

  await prisma.ticketMessage.create({ data: { ticketId: ticket.id, authorType: "CUSTOMER", authorCustomerId: customer.id, body: input.description } });
  await prisma.ticketEvent.create({ data: { ticketId: ticket.id, type: "CREATED" } });

  await runAutomationsForNewTicket(ticket.id);
  await notifyTicketCreated(ticket.id);

  revalidatePath("/portal");
  revalidatePath("/portal/tickets");
  revalidatePath("/tickets");
  redirect(`/portal/tickets/${ticket.id}`);
}

export async function addPortalReply(ticketId: string, body: string) {
  const session = await requireCustomerSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (ticket.customerId !== session.user.id) throw new Error("Forbidden");

  await prisma.ticketMessage.create({ data: { ticketId, authorType: "CUSTOMER", authorCustomerId: session.user.id, body } });
  await prisma.ticketEvent.create({ data: { ticketId, type: "CUSTOMER_REPLIED" } });
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: ticket.status === "PENDING_CUSTOMER" || ticket.status === "RESOLVED" ? "OPEN" : ticket.status },
  });

  if (ticket.assignedAgentId) {
    await prisma.notification.create({
      data: { type: "CUSTOMER_REPLIED", title: "Customer replied", body: `${ticket.subject} has a new customer reply.`, userId: ticket.assignedAgentId, ticketId },
    });
    await notifyCustomerReplied(ticketId, body);
  }

  revalidatePath(`/portal/tickets/${ticketId}`);
  revalidatePath(`/tickets/${ticketId}`);
}
