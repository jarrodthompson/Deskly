"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateCustomerNotes } from "@/lib/actions/customers";

export function NotesEditor({ customerId, initialNotes }: { customerId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateCustomerNotes(customerId, notes);
        toast.success("Notes saved.");
        setDirty(false);
      } catch {
        toast.error("Could not save notes.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={8}
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
        placeholder="Add internal notes about this customer…"
      />
      {dirty && (
        <Button size="sm" onClick={save} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          {isPending && <Loader2 className="size-3.5 animate-spin" />} Save notes
        </Button>
      )}
    </div>
  );
}
