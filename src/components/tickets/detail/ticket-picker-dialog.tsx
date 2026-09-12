"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ticketNumberLabel } from "@/lib/ticket-meta";
import { cn } from "cn";

type SearchTicket = { id: string; number: number; subject: string; status: string };

export function TicketPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  excludeTicketId,
  onConfirm,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  excludeTicketId: string;
  onConfirm: (ticketId: string) => Promise<void>;
  confirmLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTicket[]>([]);
  const [selected, setSelected] = useState<SearchTicket | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults((data.tickets as SearchTicket[]).filter((t) => t.id !== excludeTicketId));
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, excludeTicketId]);

  function confirm() {
    if (!selected) return;
    startTransition(async () => {
      try {
        await onConfirm(selected.id);
        toast.success("Done.");
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search by ticket number or subject…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <div className="max-h-56 overflow-y-auto space-y-1">
          {results.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={cn("w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors", selected?.id === t.id ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10" : "hover:bg-muted")}
            >
              <span className="font-mono text-xs text-muted-foreground mr-2">{ticketNumberLabel(t.number)}</span>
              {t.subject}
            </button>
          ))}
          {query.trim().length >= 2 && results.length === 0 && <p className="text-sm text-muted-foreground py-2">No matching tickets.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected || isPending} onClick={confirm} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
