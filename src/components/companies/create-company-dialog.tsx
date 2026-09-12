"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { createCompany } from "@/lib/actions/companies";

const PLAN_LABELS = { BASIC: "Basic", STANDARD: "Standard", PREMIUM: "Premium", ENTERPRISE: "Enterprise" };

export function CreateCompanyDialog({ slaPolicies, users }: { slaPolicies: { id: string; name: string }[]; users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "", website: "", supportPlan: "STANDARD", slaPolicyId: "", accountManagerId: "" });

  async function submit() {
    if (!form.name) {
      toast.error("Company name is required.");
      return;
    }
    setLoading(true);
    try {
      await createCompany({ ...form, supportPlan: form.supportPlan as never, slaPolicyId: form.slaPolicyId || null, accountManagerId: form.accountManagerId || null });
      toast.success("Company created.");
      setOpen(false);
      setForm({ name: "", industry: "", website: "", supportPlan: "STANDARD", slaPolicyId: "", accountManagerId: "" });
      router.refresh();
    } catch {
      toast.error("Could not create company.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-cyan-600 hover:bg-cyan-700 text-white" />}>
        <Plus className="size-4" /> Add Company
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add company</DialogTitle>
          <DialogDescription>Create a new business customer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Support plan</Label>
            <Select items={PLAN_LABELS} value={form.supportPlan} onValueChange={(v) => setForm({ ...form, supportPlan: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>SLA Policy</Label>
            <Select items={{ none: "Default", ...Object.fromEntries(slaPolicies.map((s) => [s.id, s.name])) }} value={form.slaPolicyId || "none"} onValueChange={(v) => setForm({ ...form, slaPolicyId: v === "none" ? "" : v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                {slaPolicies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Account Manager</Label>
            <Select items={{ none: "Unassigned", ...Object.fromEntries(users.map((u) => [u.id, u.name])) }} value={form.accountManagerId || "none"} onValueChange={(v) => setForm({ ...form, accountManagerId: v === "none" ? "" : v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
