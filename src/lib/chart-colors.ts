import type { TicketPriority, TicketStatus } from "@prisma/client";

export const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: "#0ea5e9",
  OPEN: "#06b6d4",
  IN_PROGRESS: "#f59e0b",
  PENDING_CUSTOMER: "#8b5cf6",
  PENDING_INTERNAL: "#d946ef",
  ON_HOLD: "#94a3b8",
  RESOLVED: "#10b981",
  CLOSED: "#cbd5e1",
  CANCELLED: "#f43f5e",
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#f97316",
  CRITICAL: "#ef4444",
};

export const CATEGORY_PALETTE = ["#06b6d4", "#6366f1", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6", "#0ea5e9"];
