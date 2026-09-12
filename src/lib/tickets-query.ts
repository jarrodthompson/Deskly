import { prisma } from "@/lib/prisma";
import type { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import { OPEN_STATUSES } from "@/lib/ticket-meta";

export type TicketListParams = {
  tab?: string;
  q?: string;
  status?: string;
  priority?: string;
  agentId?: string;
  teamId?: string;
  categoryId?: string;
  companyId?: string;
  tag?: string;
  sla?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 15;

const ticketListInclude = {
  customer: { select: { id: true, name: true, email: true } },
  company: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  assignedAgent: { select: { id: true, name: true, avatarUrl: true } },
  team: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
  attachments: { select: { id: true } },
} satisfies Prisma.TicketInclude;

export type TicketListItem = Prisma.TicketGetPayload<{ include: typeof ticketListInclude }>;

export async function getTicketListPage(params: TicketListParams, currentUserId: string) {
  const where: Prisma.TicketWhereInput = {};
  const andClauses: Prisma.TicketWhereInput[] = [];

  switch (params.tab) {
    case "mine":
      andClauses.push({ assignedAgentId: currentUserId });
      break;
    case "unassigned":
      andClauses.push({ assignedAgentId: null }, { status: { notIn: ["CLOSED", "CANCELLED"] } });
      break;
    case "open":
      andClauses.push({ status: "OPEN" });
      break;
    case "in_progress":
      andClauses.push({ status: "IN_PROGRESS" });
      break;
    case "pending":
      andClauses.push({ status: { in: ["PENDING_CUSTOMER", "PENDING_INTERNAL", "ON_HOLD"] } });
      break;
    case "resolved":
      andClauses.push({ status: "RESOLVED" });
      break;
    case "closed":
      andClauses.push({ status: "CLOSED" });
      break;
    default:
      break;
  }

  if (params.q) {
    const num = Number(params.q.replace(/^TKT-/i, ""));
    andClauses.push({
      OR: [
        { subject: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
        ...(Number.isFinite(num) && !Number.isNaN(num) ? [{ number: num }] : []),
        { customer: { name: { contains: params.q, mode: "insensitive" as const } } },
      ],
    });
  }
  if (params.status) andClauses.push({ status: { in: params.status.split(",") as TicketStatus[] } });
  if (params.priority) andClauses.push({ priority: { in: params.priority.split(",") as TicketPriority[] } });
  if (params.agentId) andClauses.push({ assignedAgentId: params.agentId });
  if (params.teamId) andClauses.push({ teamId: params.teamId });
  if (params.categoryId) andClauses.push({ categoryId: params.categoryId });
  if (params.companyId) andClauses.push({ companyId: params.companyId });
  if (params.tag) andClauses.push({ tags: { some: { tag: { name: params.tag } } } });
  if (params.sla === "at_risk") andClauses.push({ OR: [{ resolutionSla: "AT_RISK" }, { firstResponseSla: "AT_RISK" }] });
  if (params.sla === "breached") andClauses.push({ OR: [{ resolutionSla: "BREACHED" }, { firstResponseSla: "BREACHED" }] });

  if (andClauses.length) where.AND = andClauses;

  const [sortField, sortDir] = (params.sort ?? "createdAt:desc").split(":");
  const orderBy: Prisma.TicketOrderByWithRelationInput =
    sortField === "priority" ? { priority: (sortDir as "asc" | "desc") ?? "desc" } :
    sortField === "status" ? { status: (sortDir as "asc" | "desc") ?? "asc" } :
    sortField === "updatedAt" ? { updatedAt: (sortDir as "asc" | "desc") ?? "desc" } :
    sortField === "number" ? { number: (sortDir as "asc" | "desc") ?? "desc" } :
    { createdAt: (sortDir as "asc" | "desc") ?? "desc" };

  const page = Math.max(1, Number(params.page) || 1);

  const [tickets, total, tabCounts] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: ticketListInclude,
    }),
    prisma.ticket.count({ where }),
    getTabCounts(currentUserId),
  ]);

  return { tickets, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), tabCounts };
}

async function getTabCounts(currentUserId: string) {
  const [all, mine, unassigned, open, inProgress, pending, resolved, closed] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { assignedAgentId: currentUserId } }),
    prisma.ticket.count({ where: { assignedAgentId: null, status: { notIn: ["CLOSED", "CANCELLED"] } } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: { in: ["PENDING_CUSTOMER", "PENDING_INTERNAL", "ON_HOLD"] } } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.ticket.count({ where: { status: "CLOSED" } }),
  ]);
  return { all, mine, unassigned, open, in_progress: inProgress, pending, resolved, closed };
}

export async function getTicketStatsStrip() {
  const [total, open, unassigned, overdue] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { in: OPEN_STATUSES } } }),
    prisma.ticket.count({ where: { assignedAgentId: null, status: { notIn: ["CLOSED", "CANCELLED"] } } }),
    prisma.ticket.count({ where: { resolutionDueAt: { lt: new Date() }, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } } }),
  ]);
  return { total, open, unassigned, overdue };
}
