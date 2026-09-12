import type { SlaState, TicketPriority } from "@prisma/client";

export type SlaRuleLike = {
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
};

export function findRule(rules: SlaRuleLike[], priority: TicketPriority) {
  return rules.find((r) => r.priority === priority);
}

export function computeDueDates(rule: SlaRuleLike | undefined, createdAt: Date) {
  if (!rule) return { firstResponseDueAt: null, resolutionDueAt: null };
  return {
    firstResponseDueAt: new Date(createdAt.getTime() + rule.firstResponseMinutes * 60_000),
    resolutionDueAt: new Date(createdAt.getTime() + rule.resolutionMinutes * 60_000),
  };
}

/** AT_RISK once less than 20% of the total window (or under 15 min) remains. */
export function computeSlaState(params: {
  createdAt: Date;
  dueAt: Date | null;
  completedAt: Date | null;
  now?: Date;
}): SlaState {
  const { createdAt, dueAt, completedAt } = params;
  const now = params.now ?? new Date();
  if (!dueAt) return "PAUSED";
  if (completedAt) return completedAt.getTime() <= dueAt.getTime() ? "MET" : "BREACHED";
  if (now.getTime() >= dueAt.getTime()) return "BREACHED";

  const totalWindow = dueAt.getTime() - createdAt.getTime();
  const remaining = dueAt.getTime() - now.getTime();
  const riskThreshold = Math.max(totalWindow * 0.2, 15 * 60_000);
  return remaining <= riskThreshold ? "AT_RISK" : "HEALTHY";
}

export const DEFAULT_SLA_RULES: SlaRuleLike[] = [
  { priority: "CRITICAL", firstResponseMinutes: 15, resolutionMinutes: 120 },
  { priority: "URGENT", firstResponseMinutes: 30, resolutionMinutes: 240 },
  { priority: "HIGH", firstResponseMinutes: 60, resolutionMinutes: 480 },
  { priority: "MEDIUM", firstResponseMinutes: 240, resolutionMinutes: 1440 },
  { priority: "LOW", firstResponseMinutes: 480, resolutionMinutes: 2880 },
];
