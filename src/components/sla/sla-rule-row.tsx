"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/tickets/badges";
import { updateSlaRule } from "@/lib/actions/sla";
import { formatDuration } from "@/lib/ticket-meta";
import type { TicketPriority } from "@prisma/client";

export function SlaRuleRow({
  policyId,
  priority,
  firstResponseMinutes,
  resolutionMinutes,
}: {
  policyId: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fr, setFr] = useState(firstResponseMinutes);
  const [res, setRes] = useState(resolutionMinutes);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateSlaRule(policyId, priority, fr, res);
        toast.success("SLA rule updated.");
        setEditing(false);
        router.refresh();
      } catch {
        toast.error("Could not update rule.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <PriorityBadge priority={priority} className="w-20 justify-center" />
      {!editing ? (
        <>
          <span className="flex-1 text-muted-foreground">First response: <span className="text-foreground font-medium">{formatDuration(fr * 60_000)}</span></span>
          <span className="flex-1 text-muted-foreground">Resolution: <span className="text-foreground font-medium">{formatDuration(res * 60_000)}</span></span>
          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit rule"><Pencil className="size-3.5" /></Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 flex-1">
            <Input type="number" min={1} value={fr} onChange={(e) => setFr(Number(e.target.value))} className="h-7 w-20" />
            <span className="text-xs text-muted-foreground">min response</span>
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <Input type="number" min={1} value={res} onChange={(e) => setRes(Number(e.target.value))} className="h-7 w-20" />
            <span className="text-xs text-muted-foreground">min resolution</span>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={save} disabled={isPending} aria-label="Save">
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-emerald-600" />}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => { setEditing(false); setFr(firstResponseMinutes); setRes(resolutionMinutes); }} aria-label="Cancel">
            <X className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
