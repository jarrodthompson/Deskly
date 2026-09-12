"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, Building2, ExternalLink, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { assignAgent, assignTeam, addTicketTag, removeTicketTag } from "@/lib/actions/tickets";
import { SLA_META, slaCountdownLabel, ticketNumberLabel } from "@/lib/ticket-meta";
import { timeAgo, initials } from "@/lib/utils-format";
import { cn } from "cn";

type Option = { id: string; name: string };

export function TicketDetailSidebar({
  ticketId,
  number,
  customer,
  customerTicketCount,
  category,
  subcategory,
  source,
  createdAt,
  updatedAt,
  tags,
  allTags,
  assignedAgentId,
  teamId,
  agents,
  teams,
  firstResponseDueAt,
  resolutionDueAt,
  firstResponseSla,
  resolutionSla,
  slaPolicyName,
  linkedTickets,
}: {
  ticketId: string;
  number: number;
  customer: { id: string; name: string; email: string; phone: string | null; avatarUrl: string | null };
  customerTicketCount: number;
  category: string | null;
  subcategory: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  tags: { id: string; name: string; color: string }[];
  allTags: Option[];
  assignedAgentId: string | null;
  teamId: string | null;
  agents: Option[];
  teams: Option[];
  firstResponseDueAt: Date | null;
  resolutionDueAt: Date | null;
  firstResponseSla: keyof typeof SLA_META;
  resolutionSla: keyof typeof SLA_META;
  slaPolicyName: string | null;
  linkedTickets: { id: string; number: number; subject: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addingTag, setAddingTag] = useState(false);

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

  const availableTags = allTags.filter((t) => !tags.some((tag) => tag.id === t.id));

  return (
    <div className="w-full space-y-4">
      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">Customer</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              <AvatarImage src={customer.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-cyan-600 text-white">{initials(customer.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link href={`/customers/${customer.id}`} className="font-medium text-sm hover:underline truncate block">{customer.name}</Link>
              <Link href={`/customers/${customer.id}`} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                View profile <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3.5" /> {customer.email}</div>
            {customer.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> {customer.phone}</div>}
          </div>
          <div className="text-xs text-muted-foreground">{customerTicketCount} previous ticket{customerTicketCount === 1 ? "" : "s"}</div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">Ticket Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Ticket ID" value={ticketNumberLabel(number)} mono />
          <Row label="Category" value={category ?? "Uncategorized"} />
          {subcategory && <Row label="Subcategory" value={subcategory} />}
          <Row label="Source" value={source.replace(/_/g, " ")} />
          <Row label="Created" value={timeAgo(createdAt)} />
          <Row label="Updated" value={timeAgo(updatedAt)} />
          <Separator />
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="gap-1">
                  {tag.name}
                  <button onClick={() => run(() => removeTicketTag(ticketId, tag.id), "Tag removed")} className="hover:text-destructive">
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
              {!addingTag ? (
                <button onClick={() => setAddingTag(true)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                  <Plus className="size-3" /> Add tag
                </button>
              ) : (
                <Select
                  items={Object.fromEntries(availableTags.map((t) => [t.id, t.name]))}
                  onValueChange={(v) => { run(() => addTicketTag(ticketId, v), "Tag added"); setAddingTag(false); }}
                >
                  <SelectTrigger className="h-6 text-xs w-28"><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {availableTags.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">Assignment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Agent</div>
            <Select
              items={{ none: "Unassigned", ...Object.fromEntries(agents.map((a) => [a.id, a.name])) }}
              value={assignedAgentId ?? "none"}
              onValueChange={(v) => run(() => assignAgent(ticketId, v === "none" ? null : v), "Agent updated")}
              disabled={isPending}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Team</div>
            <Select
              items={{ none: "Unassigned", ...Object.fromEntries(teams.map((t) => [t.id, t.name])) }}
              value={teamId ?? "none"}
              onValueChange={(v) => run(() => assignTeam(ticketId, v === "none" ? null : v), "Team updated")}
              disabled={isPending}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium">SLA{slaPolicyName ? ` · ${slaPolicyName}` : ""}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
              <span>First Response</span>
              <span className={SLA_META[firstResponseSla].className}>{SLA_META[firstResponseSla].label}</span>
            </div>
            <div className={cn("font-medium tabular-nums", SLA_META[firstResponseSla].className)}>
              {slaCountdownLabel(firstResponseDueAt, firstResponseSla)}
            </div>
          </div>
          <Separator />
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
              <span>Resolution SLA</span>
              <span className={SLA_META[resolutionSla].className}>{SLA_META[resolutionSla].label}</span>
            </div>
            <div className={cn("font-medium tabular-nums", SLA_META[resolutionSla].className)}>
              {slaCountdownLabel(resolutionDueAt, resolutionSla)}
            </div>
          </div>
        </CardContent>
      </Card>

      {linkedTickets.length > 0 && (
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Linked Tickets</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {linkedTickets.map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="block text-sm hover:underline">
                <span className="font-mono text-xs text-muted-foreground mr-1.5">{ticketNumberLabel(t.number)}</span>
                {t.subject}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("text-right truncate max-w-[60%]", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
