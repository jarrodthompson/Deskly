"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCompany } from "@/lib/actions/companies";
import type { SupportPlan } from "@prisma/client";

const PLAN_LABELS = { BASIC: "Basic", STANDARD: "Standard", PREMIUM: "Premium", ENTERPRISE: "Enterprise" };

export function CompanySettingsForm({
  companyId,
  supportPlan,
  slaPolicyId,
  accountManagerId,
  slaPolicies,
  users,
}: {
  companyId: string;
  supportPlan: SupportPlan;
  slaPolicyId: string | null;
  accountManagerId: string | null;
  slaPolicies: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function save(patch: Parameters<typeof updateCompany>[1]) {
    startTransition(async () => {
      try {
        await updateCompany(companyId, patch);
        toast.success("Updated.");
        router.refresh();
      } catch {
        toast.error("Could not update.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Support Plan</Label>
        <Select items={PLAN_LABELS} value={supportPlan} disabled={isPending} onValueChange={(v) => save({ supportPlan: v as SupportPlan })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">SLA Policy</Label>
        <Select items={{ none: "Default", ...Object.fromEntries(slaPolicies.map((s) => [s.id, s.name])) }} value={slaPolicyId ?? "none"} disabled={isPending} onValueChange={(v) => save({ slaPolicyId: v === "none" ? null : v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default</SelectItem>
            {slaPolicies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Account Manager</Label>
        <Select items={{ none: "Unassigned", ...Object.fromEntries(users.map((u) => [u.id, u.name])) }} value={accountManagerId ?? "none"} disabled={isPending} onValueChange={(v) => save({ accountManagerId: v === "none" ? null : v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
