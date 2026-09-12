import { prisma } from "@/lib/prisma";
import type { TicketPriority, TicketStatus } from "@prisma/client";

type Condition = { field: string; operator: "equals" | "contains"; value: string };

function matchesCondition(condition: Condition, ctx: { categoryName: string | null; priority: TicketPriority; companyPlan: string | null; subject: string; description: string; companyName: string | null }): boolean {
  let subject: string | null;
  switch (condition.field) {
    case "CATEGORY":
      subject = ctx.categoryName;
      break;
    case "PRIORITY":
      subject = ctx.priority;
      break;
    case "COMPANY_PLAN":
      subject = ctx.companyPlan;
      break;
    case "COMPANY":
      subject = ctx.companyName;
      break;
    case "KEYWORD":
      subject = `${ctx.subject} ${ctx.description}`;
      break;
    default:
      return false;
  }
  if (subject === null) return false;
  if (condition.operator === "contains") return subject.toLowerCase().includes(condition.value.toLowerCase());
  return subject.toLowerCase() === condition.value.toLowerCase();
}

export async function runAutomationsForNewTicket(ticketId: string) {
  const [automations, ticket] = await Promise.all([
    prisma.automation.findMany({
      where: { isActive: true, triggerOn: "TICKET_CREATED" },
      include: { actions: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { category: { select: { name: true } }, company: { select: { name: true, supportPlan: true } } },
    }),
  ]);
  if (!ticket) return;

  const ctx = {
    categoryName: ticket.category?.name ?? null,
    priority: ticket.priority,
    companyPlan: ticket.company?.supportPlan ?? null,
    companyName: ticket.company?.name ?? null,
    subject: ticket.subject,
    description: ticket.description,
  };

  for (const automation of automations) {
    const conditions = (automation.conditions as unknown as Condition[]) ?? [];
    const isMatch = conditions.length > 0 && conditions.every((c) => matchesCondition(c, ctx));
    if (!isMatch) continue;

    const resultLog: Record<string, unknown>[] = [];

    for (const action of automation.actions) {
      const value = action.value as Record<string, string>;
      switch (action.type) {
        case "ASSIGN_TEAM": {
          const team = await prisma.team.findUnique({ where: { name: value.teamName } });
          if (team) {
            await prisma.ticket.update({ where: { id: ticketId }, data: { teamId: team.id } });
            resultLog.push({ action: "ASSIGN_TEAM", team: team.name });
          }
          break;
        }
        case "ASSIGN_AGENT": {
          const agent = await prisma.user.findUnique({ where: { email: value.agentEmail } });
          if (agent) {
            await prisma.ticket.update({ where: { id: ticketId }, data: { assignedAgentId: agent.id, status: "OPEN" } });
            resultLog.push({ action: "ASSIGN_AGENT", agent: agent.name });
          }
          break;
        }
        case "CHANGE_STATUS": {
          await prisma.ticket.update({ where: { id: ticketId }, data: { status: value.status as TicketStatus } });
          resultLog.push({ action: "CHANGE_STATUS", status: value.status });
          break;
        }
        case "CHANGE_PRIORITY": {
          await prisma.ticket.update({ where: { id: ticketId }, data: { priority: value.priority as TicketPriority } });
          resultLog.push({ action: "CHANGE_PRIORITY", priority: value.priority });
          break;
        }
        case "ADD_TAG": {
          const tag = await prisma.tag.findUnique({ where: { name: value.tagName } });
          if (tag) {
            await prisma.ticketTag.upsert({
              where: { ticketId_tagId: { ticketId, tagId: tag.id } },
              update: {},
              create: { ticketId, tagId: tag.id },
            });
            resultLog.push({ action: "ADD_TAG", tag: tag.name });
          }
          break;
        }
        case "SEND_NOTIFICATION": {
          const recipients = await prisma.user.findMany({ where: { roleKey: { in: ["ADMIN", "SUPER_ADMIN", "MANAGER", "TEAM_LEADER"] } }, select: { id: true } });
          await prisma.notification.createMany({
            data: recipients.map((r) => ({
              type: "TICKET_ESCALATED" as const,
              title: `Automation triggered: ${automation.name}`,
              body: `${ticket.subject} matched the "${automation.name}" rule.`,
              userId: r.id,
              ticketId,
            })),
          });
          resultLog.push({ action: "SEND_NOTIFICATION", recipients: recipients.length });
          break;
        }
        case "ESCALATE_TICKET": {
          const escalated: TicketPriority = ticket.priority === "LOW" || ticket.priority === "MEDIUM" ? "HIGH" : "CRITICAL";
          await prisma.ticket.update({ where: { id: ticketId }, data: { priority: escalated } });
          resultLog.push({ action: "ESCALATE_TICKET", to: escalated });
          break;
        }
        case "SEND_EMAIL": {
          resultLog.push({ action: "SEND_EMAIL", note: "No email provider configured; skipped." });
          break;
        }
      }
    }

    await prisma.automationExecution.create({
      data: { automationId: automation.id, ticketId, result: resultLog },
    });
  }
}
