"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitPortalTicket } from "@/lib/actions/portal";
import { PRIORITY_META } from "@/lib/ticket-meta";
import type { TicketPriority } from "@prisma/client";

type Option = { id: string; name: string };

export function SubmitTicketForm({ categories }: { categories: Option[] }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in a subject and description.");
      return;
    }
    startTransition(async () => {
      try {
        await submitPortalTicket({ subject, description, categoryId: categoryId || null, priority });
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Something went wrong submitting your ticket.");
      }
    });
  }

  return (
    <Card className="shadow-none max-w-2xl">
      <CardContent className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your issue" required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Give us as much detail as possible…" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select items={{ none: "General", ...Object.fromEntries(categories.map((c) => [c.id, c.name])) }} value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select items={Object.fromEntries(Object.entries(PRIORITY_META).map(([k, m]) => [k, m.label]))} value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {isPending && <Loader2 className="size-4 animate-spin" />} Submit Ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
