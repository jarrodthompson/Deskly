"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleAutomationActive, deleteAutomation } from "@/lib/actions/automations";

const ACTION_LABELS: Record<string, string> = {
  ASSIGN_AGENT: "Assign Agent", ASSIGN_TEAM: "Assign Team", CHANGE_STATUS: "Change Status",
  CHANGE_PRIORITY: "Change Priority", ADD_TAG: "Add Tag", SEND_NOTIFICATION: "Send Notification",
  SEND_EMAIL: "Send Email", ESCALATE_TICKET: "Escalate Ticket",
};

type Condition = { field: string; operator: string; value: string };

export function AutomationCard({
  automation,
}: {
  automation: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    conditions: unknown;
    actions: { id: string; type: string; value: unknown }[];
    executions: number;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const conditions = (automation.conditions as Condition[]) ?? [];

  return (
    <Card className="shadow-none">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="size-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{automation.name}</div>
              {automation.description && <div className="text-xs text-muted-foreground mt-0.5">{automation.description}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={automation.isActive}
              disabled={isPending}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  try {
                    await toggleAutomationActive(automation.id, checked);
                    router.refresh();
                  } catch {
                    toast.error("Could not update automation.");
                  }
                })
              }
            />
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete automation"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteAutomation(automation.id);
                    toast.success("Automation deleted.");
                    router.refresh();
                  } catch {
                    toast.error("Could not delete automation.");
                  }
                })
              }
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
          <div>
            <span className="font-semibold uppercase tracking-wide text-muted-foreground mr-1.5">If</span>
            {conditions.map((c, i) => (
              <span key={i}>
                {i > 0 && " and "}
                <span className="font-medium">{c.field.replace(/_/g, " ").toLowerCase()}</span> {c.operator} <span className="font-medium">&ldquo;{c.value}&rdquo;</span>
              </span>
            ))}
          </div>
          <div>
            <span className="font-semibold uppercase tracking-wide text-muted-foreground mr-1.5">Then</span>
            {automation.actions.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ", "}
                {ACTION_LABELS[a.type] ?? a.type}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline">{automation.isActive ? "Active" : "Inactive"}</Badge>
          <span>{automation.executions} execution{automation.executions === 1 ? "" : "s"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
