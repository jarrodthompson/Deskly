"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, MoreHorizontal, UserCheck, ArrowUpCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { ticketNumberLabel, slaCountdownLabel } from "@/lib/ticket-meta";
import { timeAgo, initials } from "@/lib/utils-format";
import { assignAgent, updateTicketStatus, escalateTicket, bulkUpdateTickets } from "@/lib/actions/tickets";
import type { TicketListItem } from "@/lib/tickets-query";

export function TicketTable({ tickets, currentUserId }: { tickets: TicketListItem[]; currentUserId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === tickets.length ? new Set() : new Set(tickets.map((t) => t.id))));
  }

  function runBulk(label: string, action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
        toast.success(label);
        setSelected(new Set());
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-cyan-50 dark:bg-cyan-500/10 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => runBulk("Assigned to you", () => bulkUpdateTickets([...selected], { assignedAgentId: currentUserId }))}>
              <UserCheck className="size-3.5" /> Assign to me
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => runBulk("Marked in progress", () => bulkUpdateTickets([...selected], { status: "IN_PROGRESS" }))}>
              <Loader2 className="size-3.5" /> In Progress
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => runBulk("Marked resolved", () => bulkUpdateTickets([...selected], { status: "RESOLVED" }))}>
              <CheckCircle2 className="size-3.5" /> Resolve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="w-10 px-3 py-2.5"><Checkbox checked={tickets.length > 0 && selected.size === tickets.length} onCheckedChange={toggleAll} /></th>
              <th className="px-3 py-2.5 text-left font-medium">Ticket</th>
              <th className="px-3 py-2.5 text-left font-medium">Customer</th>
              <th className="px-3 py-2.5 text-left font-medium hidden lg:table-cell">Company</th>
              <th className="px-3 py-2.5 text-left font-medium hidden xl:table-cell">Category</th>
              <th className="px-3 py-2.5 text-left font-medium">Agent</th>
              <th className="px-3 py-2.5 text-left font-medium hidden lg:table-cell">Team</th>
              <th className="px-3 py-2.5 text-left font-medium">Priority</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium hidden xl:table-cell">Created</th>
              <th className="px-3 py-2.5 text-left font-medium hidden xl:table-cell">Updated</th>
              <th className="px-3 py-2.5 text-left font-medium">SLA</th>
              <th className="px-3 py-2.5 text-left font-medium w-10"></th>
              <th className="px-3 py-2.5 text-left font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => {
              const slaState = t.resolutionSla;
              return (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5"><Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggle(t.id)} /></td>
                  <td className="px-3 py-2.5 max-w-[280px]">
                    <Link href={`/tickets/${t.id}`} className="block hover:underline">
                      <div className="font-mono text-xs text-muted-foreground">{ticketNumberLabel(t.number)}</div>
                      <div className="font-medium truncate">{t.subject}</div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{t.customer.name}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap hidden lg:table-cell text-muted-foreground">{t.company?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap hidden xl:table-cell text-muted-foreground">{t.category?.name ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {t.assignedAgent ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Avatar className="size-5">
                          <AvatarImage src={t.assignedAgent.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[9px] bg-cyan-600 text-white">{initials(t.assignedAgent.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{t.assignedAgent.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap hidden lg:table-cell text-muted-foreground">{t.team?.name ?? "—"}</td>
                  <td className="px-3 py-2.5"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap hidden xl:table-cell text-muted-foreground">{timeAgo(t.createdAt)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap hidden xl:table-cell text-muted-foreground">{timeAgo(t.updatedAt)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={slaState === "BREACHED" ? "text-red-600 dark:text-red-400 font-medium" : slaState === "AT_RISK" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                      {slaCountdownLabel(t.resolutionDueAt, slaState)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {t.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-xs"><Paperclip className="size-3.5" />{t.attachments.length}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ticket actions" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={`/tickets/${t.id}`} />}>View ticket</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => runBulk("Assigned to you", () => assignAgent(t.id, currentUserId))}>
                          <UserCheck className="size-4" /> Assign to me
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runBulk("Marked in progress", () => updateTicketStatus(t.id, "IN_PROGRESS"))}>
                          <Loader2 className="size-4" /> Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runBulk("Marked resolved", () => updateTicketStatus(t.id, "RESOLVED"))}>
                          <CheckCircle2 className="size-4" /> Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => runBulk("Ticket escalated", () => escalateTicket(t.id))}>
                          <ArrowUpCircle className="size-4" /> Escalate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No tickets match your filters.</div>
        )}
      </div>
    </div>
  );
}
