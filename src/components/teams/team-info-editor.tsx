"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateTeam } from "@/lib/actions/teams";

export function TeamInfoEditor({ teamId, name, description }: { teamId: string; name: string; description: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState({ name, description: description ?? "" });
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateTeam(teamId, form);
        toast.success("Team updated.");
        setDirty(false);
        router.refresh();
      } catch {
        toast.error("Could not update team. The name may already exist.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Team name</Label>
        <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setDirty(true); }} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setDirty(true); }} rows={2} />
      </div>
      {dirty && (
        <Button size="sm" onClick={save} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          {isPending && <Loader2 className="size-3.5 animate-spin" />} Save
        </Button>
      )}
    </div>
  );
}
