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
import { createStaffUser } from "@/lib/actions/admin";
import { ROLE_META, STAFF_ROLES, type StaffRole } from "@/lib/rbac";

export function CreateUserDialog({ teams }: { teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "AGENT" as StaffRole, teamId: "" });

  async function submit() {
    if (!form.name || !form.email || form.password.length < 8) {
      toast.error("Name, email and an 8+ character password are required.");
      return;
    }
    setLoading(true);
    try {
      await createStaffUser({ ...form, teamId: form.teamId || null });
      toast.success("User created.");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "AGENT", teamId: "" });
      router.refresh();
    } catch {
      toast.error("Could not create user. The email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-cyan-600 hover:bg-cyan-700 text-white" />}>
        <Plus className="size-4" /> Add User
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add staff user</DialogTitle>
          <DialogDescription>Create a new agent or admin account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Temporary password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select items={Object.fromEntries(STAFF_ROLES.map((r) => [r, ROLE_META[r].name]))} value={form.role} onValueChange={(v) => setForm({ ...form, role: v as StaffRole })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_META[r].name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select items={{ none: "No team", ...Object.fromEntries(teams.map((t) => [t.id, t.name])) }} value={form.teamId || "none"} onValueChange={(v) => setForm({ ...form, teamId: v === "none" ? "" : v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
