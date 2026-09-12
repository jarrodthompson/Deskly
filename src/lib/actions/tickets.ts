"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { computeDueDates, findRule } from "@/lib/sla";
import { runAutomationsForNewTicket } from "@/lib/automation-engine";
import {
  notifyAgentReplied,
  notifyTicketAssigned,
  notifyTicketCreated,
  notifyTicketResolved,
} from "@/lib/email/notify";
import type { TicketPriority, TicketStatus, TicketSource } from "@prisma/client";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

export type CreateTicketInput = {
  subject: string;
  description: string;
  customerId: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  priority: TicketPriority;
  teamId?: string | null;
  assignedAgentId?: string | null;
  tagIds?: string[];
  dueDate?: string | null;
  source?: TicketSource;
  attachments?: { fileName: string; fileUrl: string; fileType: string; fileSize: number }[];
  customFieldValues?: { fieldId: string; value: string }[];
};

export async function createTicket(input: CreateTicketInput) {
  const session = await requireStaffSession();

  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: input.customerId } });
  const company = customer.companyId ? await prisma.company.findUnique({ where: { id: customer.companyId } }) : null;

  const slaPolicy = company?.slaPolicyId
    ? await prisma.sLAPolicy.findUnique({ where: { id: company.slaPolicyId }, include: { rules: true } })
    : await prisma.sLAPolicy.findFirst({ where: { isDefault: true }, include: { rules: true } });

  const now = new Date();
  const rule = slaPolicy ? findRule(slaPolicy.rules, input.priority) : undefined;
  const { firstResponseDueAt, resolutionDueAt } = computeDueDates(rule, now);

  const ticket = await prisma.ticket.create({
    data: {
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      status: input.assignedAgentId ? "OPEN" : "NEW",
      source: input.source ?? "MANUAL",
      customerId: input.customerId,
      companyId: customer.companyId,
      categoryId: input.categoryId || null,
      subcategoryId: input.subcategoryId || null,
      teamId: input.teamId || null,
      assignedAgentId: input.assignedAgentId || null,
      createdById: session.user.id,
      slaPolicyId: slaPolicy?.id ?? null,
      firstResponseDueAt,
      resolutionDueAt,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      tags: input.tagIds?.length ? { create: input.tagIds.map((tagId) => ({ tagId })) } : undefined,
      customFieldValues: input.customFieldValues?.length
        ? { create: input.customFieldValues.filter((v) => v.value.trim() !== "").map((v) => ({ fieldId: v.fieldId, value: v.value })) }
        : undefined,
    },
  });

  await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, authorType: "AGENT", authorUserId: session.user.id, body: input.description },
  });

  await prisma.ticketEvent.create({ data: { ticketId: ticket.id, type: "CREATED", actorUserId: session.user.id } });

  if (input.assignedAgentId) {
    await prisma.ticketEvent.create({ data: { ticketId: ticket.id, type: "AGENT_ASSIGNED", actorUserId: session.user.id, toValue: input.assignedAgentId } });
    await prisma.notification.create({
      data: {
        type: "TICKET_ASSIGNED",
        title: "New ticket assigned to you",
        body: `${ticket.subject} was assigned to you.`,
        userId: input.assignedAgentId,
        ticketId: ticket.id,
      },
    });
  }

  if (input.attachments?.length) {
    await prisma.ticketAttachment.createMany({
      data: input.attachments.map((a) => ({
        ticketId: ticket.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
        fileSize: a.fileSize,
        uploadedByUserId: session.user.id,
      })),
    });
    await prisma.ticketEvent.create({ data: { ticketId: ticket.id, type: "ATTACHMENT_UPLOADED", actorUserId: session.user.id } });
  }

  await runAutomationsForNewTicket(ticket.id);

  await notifyTicketCreated(ticket.id);
  if (input.assignedAgentId) await notifyTicketAssigned(ticket.id, input.assignedAgentId);

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (ticket.status === status) return;

  const now = new Date();
  const isResolving = (status === "RESOLVED" || status === "CLOSED") && !ticket.resolvedAt;
  const isReopening = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const isClosing = status === "CLOSED" && !ticket.closedAt;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      resolvedAt: isResolving ? now : status === "RESOLVED" || status === "CLOSED" ? ticket.resolvedAt : null,
      closedAt: isClosing ? now : status === "CLOSED" ? ticket.closedAt : null,
    },
  });

  await prisma.ticketEvent.create({
    data: {
      ticketId,
      type: isReopening && status !== "RESOLVED" && status !== "CLOSED" ? "REOPENED" : status === "RESOLVED" ? "RESOLVED" : status === "CLOSED" ? "CLOSED" : "STATUS_CHANGED",
      actorUserId: session.user.id,
      fromValue: ticket.status,
      toValue: status,
    },
  });

  if (isResolving) await notifyTicketResolved(ticketId);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (ticket.priority === priority) return;

  await prisma.ticket.update({ where: { id: ticketId }, data: { priority } });
  await prisma.ticketEvent.create({
    data: { ticketId, type: "PRIORITY_CHANGED", actorUserId: session.user.id, fromValue: ticket.priority, toValue: priority },
  });

  if (priority === "CRITICAL") {
    const recipients = await prisma.user.findMany({ where: { roleKey: { in: ["ADMIN", "SUPER_ADMIN", "MANAGER", "TEAM_LEADER"] } }, select: { id: true } });
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        type: "PRIORITY_CRITICAL" as const,
        title: "Priority changed to Critical",
        body: `${ticket.subject} was changed to Critical priority.`,
        userId: r.id,
        ticketId,
      })),
    });
  }

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function assignAgent(ticketId: string, agentId: string | null) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedAgentId: agentId,
      status: ticket.status === "NEW" && agentId ? "OPEN" : ticket.status,
    },
  });
  await prisma.ticketEvent.create({
    data: { ticketId, type: "AGENT_ASSIGNED", actorUserId: session.user.id, fromValue: ticket.assignedAgentId, toValue: agentId },
  });

  if (agentId) {
    await prisma.notification.create({
      data: {
        type: "TICKET_ASSIGNED",
        title: "New ticket assigned to you",
        body: `${ticket.subject} was assigned to you.`,
        userId: agentId,
        ticketId,
      },
    });
    await notifyTicketAssigned(ticketId, agentId);
  }

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function assignTeam(ticketId: string, teamId: string | null) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });

  await prisma.ticket.update({ where: { id: ticketId }, data: { teamId } });
  await prisma.ticketEvent.create({
    data: { ticketId, type: "TEAM_CHANGED", actorUserId: session.user.id, fromValue: ticket.teamId, toValue: teamId },
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function escalateTicket(ticketId: string) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  const escalatedPriority: TicketPriority = ticket.priority === "CRITICAL" ? "CRITICAL" : ticket.priority === "URGENT" ? "CRITICAL" : "URGENT";

  await prisma.ticket.update({ where: { id: ticketId }, data: { priority: escalatedPriority } });
  await prisma.ticketEvent.create({
    data: { ticketId, type: "ESCALATED", actorUserId: session.user.id, fromValue: ticket.priority, toValue: escalatedPriority },
  });

  const recipients = await prisma.user.findMany({ where: { roleKey: { in: ["ADMIN", "SUPER_ADMIN", "MANAGER", "TEAM_LEADER"] } }, select: { id: true } });
  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      type: "TICKET_ESCALATED" as const,
      title: "Ticket escalated",
      body: `${ticket.subject} was escalated.`,
      userId: r.id,
      ticketId,
    })),
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function bulkUpdateTickets(
  ticketIds: string[],
  patch: { status?: TicketStatus; priority?: TicketPriority; assignedAgentId?: string | null; teamId?: string | null }
) {
  await requireStaffSession();
  if (ticketIds.length === 0) return;

  if (patch.status) {
    for (const id of ticketIds) await updateTicketStatus(id, patch.status);
  }
  if (patch.priority) {
    for (const id of ticketIds) await updateTicketPriority(id, patch.priority);
  }
  if (patch.assignedAgentId !== undefined) {
    for (const id of ticketIds) await assignAgent(id, patch.assignedAgentId);
  }
  if (patch.teamId !== undefined) {
    for (const id of ticketIds) await assignTeam(id, patch.teamId);
  }

  revalidatePath("/tickets");
}

export async function addReply(ticketId: string, body: string, attachments?: { fileName: string; fileUrl: string; fileType: string; fileSize: number }[]) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });

  const message = await prisma.ticketMessage.create({
    data: { ticketId, authorType: "AGENT", authorUserId: session.user.id, body },
  });

  if (attachments?.length) {
    await prisma.ticketAttachment.createMany({
      data: attachments.map((a) => ({ ticketId, messageId: message.id, fileName: a.fileName, fileUrl: a.fileUrl, fileType: a.fileType, fileSize: a.fileSize, uploadedByUserId: session.user.id })),
    });
  }

  const isFirstResponse = !ticket.firstRespondedAt;
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      firstRespondedAt: isFirstResponse ? new Date() : ticket.firstRespondedAt,
      status: ticket.status === "NEW" || ticket.status === "PENDING_CUSTOMER" ? "OPEN" : ticket.status,
    },
  });

  await prisma.ticketEvent.create({ data: { ticketId, type: "AGENT_REPLIED", actorUserId: session.user.id } });

  await prisma.notification.create({
    data: {
      type: "CUSTOMER_REPLIED",
      title: "Agent replied",
      body: `A reply was posted on ${ticket.subject}.`,
      customerId: ticket.customerId,
      ticketId,
    },
  });

  await notifyAgentReplied(ticketId, session.user.name, body);

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function addNote(
  ticketId: string,
  body: string,
  mentionedUserIds: string[] = [],
  attachments?: { fileName: string; fileUrl: string; fileType: string; fileSize: number }[]
) {
  const session = await requireStaffSession();
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });

  const note = await prisma.ticketNote.create({
    data: { ticketId, authorId: session.user.id, body, mentionedUserIds },
  });

  if (attachments?.length) {
    await prisma.ticketAttachment.createMany({
      data: attachments.map((a) => ({ ticketId, noteId: note.id, fileName: a.fileName, fileUrl: a.fileUrl, fileType: a.fileType, fileSize: a.fileSize, uploadedByUserId: session.user.id })),
    });
  }

  await prisma.ticketEvent.create({ data: { ticketId, type: "NOTE_ADDED", actorUserId: session.user.id } });

  if (mentionedUserIds.length) {
    await prisma.notification.createMany({
      data: mentionedUserIds.map((userId) => ({
        type: "AGENT_MENTIONED" as const,
        title: "You were mentioned",
        body: `${session.user.name} mentioned you on ${ticket.subject}.`,
        userId,
        ticketId,
      })),
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
}

export async function linkTicket(ticketId: string, linkedTicketId: string) {
  await requireStaffSession();
  if (ticketId === linkedTicketId) throw new Error("A ticket cannot be linked to itself.");
  await prisma.ticketLink.upsert({
    where: { ticketId_linkedTicketId: { ticketId, linkedTicketId } },
    update: {},
    create: { ticketId, linkedTicketId },
  });
  await prisma.ticketEvent.create({ data: { ticketId, type: "LINKED", toValue: linkedTicketId } });
  revalidatePath(`/tickets/${ticketId}`);
}

export async function mergeTicket(ticketId: string, mergeIntoId: string) {
  const session = await requireStaffSession();
  if (ticketId === mergeIntoId) throw new Error("A ticket cannot be merged into itself.");

  await prisma.ticket.update({ where: { id: ticketId }, data: { mergedIntoId: mergeIntoId, status: "CLOSED", closedAt: new Date() } });
  await prisma.ticketEvent.create({ data: { ticketId, type: "MERGED", actorUserId: session.user.id, toValue: mergeIntoId } });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath(`/tickets/${mergeIntoId}`);
  revalidatePath("/tickets");
}

export async function submitCsat(ticketId: string, score: number, comment?: string) {
  const session = await auth();
  if (!session || session.user.kind !== "customer") throw new Error("Not authenticated");
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (ticket.customerId !== session.user.id) throw new Error("Forbidden");
  await prisma.customerSatisfaction.upsert({
    where: { ticketId },
    update: { score, comment },
    create: { ticketId, customerId: ticket.customerId, score, comment },
  });
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/portal");
}

export async function setTicketCustomFieldValue(ticketId: string, fieldId: string, value: string) {
  await requireStaffSession();
  if (value.trim() === "") {
    await prisma.ticketCustomFieldValue.deleteMany({ where: { ticketId, fieldId } });
  } else {
    await prisma.ticketCustomFieldValue.upsert({
      where: { ticketId_fieldId: { ticketId, fieldId } },
      update: { value },
      create: { ticketId, fieldId, value },
    });
  }
  revalidatePath(`/tickets/${ticketId}`);
}

export async function addTicketTag(ticketId: string, tagId: string) {
  const session = await requireStaffSession();
  await prisma.ticketTag.upsert({
    where: { ticketId_tagId: { ticketId, tagId } },
    update: {},
    create: { ticketId, tagId },
  });
  await prisma.ticketEvent.create({ data: { ticketId, type: "TAG_ADDED", actorUserId: session.user.id, toValue: tagId } });
  revalidatePath(`/tickets/${ticketId}`);
}

export async function removeTicketTag(ticketId: string, tagId: string) {
  const session = await requireStaffSession();
  await prisma.ticketTag.delete({ where: { ticketId_tagId: { ticketId, tagId } } }).catch(() => null);
  await prisma.ticketEvent.create({ data: { ticketId, type: "TAG_REMOVED", actorUserId: session.user.id, fromValue: tagId } });
  revalidatePath(`/tickets/${ticketId}`);
}
