import { cn } from "cn";
import { STATUS_META, PRIORITY_META, SLA_META } from "@/lib/ticket-meta";
import type { SlaState, TicketPriority, TicketStatus } from "@prisma/client";

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: TicketPriority; className?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function SlaBadge({ state, label, className }: { state: SlaState; label: string; className?: string }) {
  const meta = SLA_META[state];
  return <span className={cn("text-xs font-medium whitespace-nowrap", meta.className, className)}>{label}</span>;
}
