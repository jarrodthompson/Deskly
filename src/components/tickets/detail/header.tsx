"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpCircle, GitMerge, Link2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTicketStatus, updateTicketPriority, escalateTicket } from "@/lib/actions/tickets";
import { STATUS_META, PRIORITY_META, ticketNumberLabel } from "@/lib/ticket-meta";
import type { TicketPriority, TicketStatus } from "@prisma/client";
import { cn } from "cn";

export function TicketDetailHeader({
  ticketId,
  number,
  subject,
  status,
  priority,
  onOpenMerge,
  onOpenLink,
}: {
  ticketId: string;
  number: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  onOpenMerge: () => void;
  onOpenLink: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(message);
        router.refresh();
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }

  return (
    <div className="border-b bg-background px-4 md:px-6 py-3 space-y-2">
      <Link href="/tickets" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to tickets
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-muted-foreground">{ticketNumberLabel(number)}</div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight truncate">{subject}</h1>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Select
            items={Object.fromEntries(Object.entries(STATUS_META).map(([k, m]) => [k, m.label]))}
            value={status}
            onValueChange={(v) => run(() => updateTicketStatus(ticketId, v as TicketStatus), "Status updated")}
          >
            <SelectTrigger className={cn("h-7 text-xs font-medium", STATUS_META[status].className)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_META).map(([key, meta]) => <SelectItem key={key} value={key}>{meta.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            items={Object.fromEntries(Object.entries(PRIORITY_META).map(([k, m]) => [k, m.label]))}
            value={priority}
            onValueChange={(v) => run(() => updateTicketPriority(ticketId, v as TicketPriority), "Priority updated")}
          >
            <SelectTrigger className={cn("h-7 text-xs font-medium", PRIORITY_META[priority].className)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_META).map(([key, meta]) => <SelectItem key={key} value={key}>{meta.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => escalateTicket(ticketId), "Ticket escalated")}>
            <ArrowUpCircle className="size-3.5" /> Escalate
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon-sm" variant="outline" aria-label="More actions" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenLink}><Link2 className="size-4" /> Link related ticket</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenMerge}><GitMerge className="size-4" /> Merge into another ticket</DropdownMenuItem>
              <DropdownMenuItem onClick={() => run(() => updateTicketStatus(ticketId, "CLOSED"), "Ticket closed")}>Close ticket</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
