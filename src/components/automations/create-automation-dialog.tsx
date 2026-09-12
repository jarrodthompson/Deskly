"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAutomation, type AutomationActionInput, type AutomationConditionInput } from "@/lib/actions/automations";
import { STATUS_META, PRIORITY_META } from "@/lib/ticket-meta";
import type { AutomationActionType } from "@prisma/client";

const CONDITION_FIELDS = { CATEGORY: "Category", PRIORITY: "Priority", COMPANY_PLAN: "Company Support Plan", COMPANY: "Company", KEYWORD: "Keyword in subject/description" };
const ACTION_TYPES: Record<AutomationActionType, string> = {
  ASSIGN_AGENT: "Assign Agent",
  ASSIGN_TEAM: "Assign Team",
  CHANGE_STATUS: "Change Status",
  CHANGE_PRIORITY: "Change Priority",
  ADD_TAG: "Add Tag",
  SEND_NOTIFICATION: "Send Notification",
  SEND_EMAIL: "Send Email",
  ESCALATE_TICKET: "Escalate Ticket",
};

type Option = { id: string; name: string };

export function CreateAutomationDialog({
  categories,
  companies,
  teams,
  agents,
  tags,
}: {
  categories: Option[];
  companies: Option[];
  teams: Option[];
  agents: { id: string; name: string; email: string }[];
  tags: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState<AutomationConditionInput[]>([{ field: "CATEGORY", operator: "equals", value: "" }]);
  const [actions, setActions] = useState<AutomationActionInput[]>([{ type: "ASSIGN_TEAM", value: {} }]);

  function updateCondition(i: number, patch: Partial<AutomationConditionInput>) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function updateAction(i: number, patch: Partial<AutomationActionInput>) {
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  async function submit() {
    if (!name.trim()) return toast.error("Name is required.");
    if (conditions.some((c) => !c.value)) return toast.error("Every condition needs a value.");
    setLoading(true);
    try {
      await createAutomation({ name, description, conditions, actions });
      toast.success("Automation created.");
      setOpen(false);
      setName(""); setDescription("");
      setConditions([{ field: "CATEGORY", operator: "equals", value: "" }]);
      setActions([{ type: "ASSIGN_TEAM", value: {} }]);
      router.refresh();
    } catch {
      toast.error("Could not create automation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-cyan-600 hover:bg-cyan-700 text-white" />}>
        <Plus className="size-4" /> New Automation
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create automation</DialogTitle>
          <DialogDescription>Runs when a new ticket is created and all conditions match.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>IF (all conditions match)</Label>
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Select items={CONDITION_FIELDS} value={c.field} onValueChange={(v) => updateCondition(i, { field: v, value: "" })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CONDITION_FIELDS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <ConditionValueInput field={c.field} value={c.value} onChange={(v) => updateCondition(i, { value: v })} categories={categories} companies={companies} />
                <Button size="icon-sm" variant="ghost" onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove condition"><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setConditions((prev) => [...prev, { field: "CATEGORY", operator: "equals", value: "" }])}>
              <Plus className="size-3.5" /> Add condition
            </Button>
          </div>

          <div className="space-y-2">
            <Label>THEN</Label>
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Select items={ACTION_TYPES} value={a.type} onValueChange={(v) => updateAction(i, { type: v as AutomationActionType, value: {} })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ACTION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <ActionValueInput type={a.type} value={a.value} onChange={(v) => updateAction(i, { value: v })} teams={teams} agents={agents} tags={tags} />
                <Button size="icon-sm" variant="ghost" onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove action"><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setActions((prev) => [...prev, { type: "ADD_TAG", value: {} }])}>
              <Plus className="size-3.5" /> Add action
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={loading} onClick={submit} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {loading && <Loader2 className="size-4 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConditionValueInput({ field, value, onChange, categories, companies }: { field: string; value: string; onChange: (v: string) => void; categories: Option[]; companies: Option[] }) {
  if (field === "CATEGORY") {
    return (
      <Select items={Object.fromEntries(categories.map((c) => [c.name, c.name]))} value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose category" /></SelectTrigger>
        <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (field === "PRIORITY") {
    return (
      <Select items={Object.fromEntries(Object.entries(PRIORITY_META).map(([k, m]) => [k, m.label]))} value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose priority" /></SelectTrigger>
        <SelectContent>{Object.entries(PRIORITY_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (field === "COMPANY_PLAN") {
    const plans = { BASIC: "Basic", STANDARD: "Standard", PREMIUM: "Premium", ENTERPRISE: "Enterprise" };
    return (
      <Select items={plans} value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose plan" /></SelectTrigger>
        <SelectContent>{Object.entries(plans).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (field === "COMPANY") {
    return (
      <Select items={Object.fromEntries(companies.map((c) => [c.name, c.name]))} value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose company" /></SelectTrigger>
        <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  return <Input className="flex-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Keyword…" />;
}

function ActionValueInput({
  type,
  value,
  onChange,
  teams,
  agents,
  tags,
}: {
  type: AutomationActionType;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  teams: Option[];
  agents: { id: string; name: string; email: string }[];
  tags: Option[];
}) {
  if (type === "ASSIGN_TEAM") {
    return (
      <Select items={Object.fromEntries(teams.map((t) => [t.name, t.name]))} value={value.teamName ?? ""} onValueChange={(v) => onChange({ teamName: v })}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose team" /></SelectTrigger>
        <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (type === "ASSIGN_AGENT") {
    return (
      <Select items={Object.fromEntries(agents.map((a) => [a.email, a.name]))} value={value.agentEmail ?? ""} onValueChange={(v) => onChange({ agentEmail: v })}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose agent" /></SelectTrigger>
        <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.email}>{a.name}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (type === "CHANGE_STATUS") {
    return (
      <Select items={Object.fromEntries(Object.entries(STATUS_META).map(([k, m]) => [k, m.label]))} value={value.status ?? ""} onValueChange={(v) => onChange({ status: v })}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose status" /></SelectTrigger>
        <SelectContent>{Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (type === "CHANGE_PRIORITY") {
    return (
      <Select items={Object.fromEntries(Object.entries(PRIORITY_META).map(([k, m]) => [k, m.label]))} value={value.priority ?? ""} onValueChange={(v) => onChange({ priority: v })}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose priority" /></SelectTrigger>
        <SelectContent>{Object.entries(PRIORITY_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  if (type === "ADD_TAG") {
    return (
      <Select items={Object.fromEntries(tags.map((t) => [t.name, t.name]))} value={value.tagName ?? ""} onValueChange={(v) => onChange({ tagName: v })}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose tag" /></SelectTrigger>
        <SelectContent>{tags.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  return <div className="flex-1 text-xs text-muted-foreground px-2">No additional configuration needed.</div>;
}
