"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSlaPolicy } from "@/lib/actions/sla";

export function CreateSlaPolicyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function submit() {
    if (!name.trim()) {
      toast.error("Policy name is required.");
      return;
    }
    setLoading(true);
    try {
      await createSlaPolicy(name, description);
      toast.success("SLA policy created with default rules — adjust as needed.");
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch {
      toast.error("Could not create policy. The name may already exist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-cyan-600 hover:bg-cyan-700 text-white" />}>
        <Plus className="size-4" /> New SLA Policy
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create SLA policy</DialogTitle>
          <DialogDescription>Starts with default response and resolution targets you can customize.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priority Support" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
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
