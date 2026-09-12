"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addPortalReply } from "@/lib/actions/portal";
import { submitCsat } from "@/lib/actions/tickets";
import { initials, timeAgo } from "@/lib/utils-format";
import { cn } from "cn";

type Message = { id: string; createdAt: Date; authorType: "CUSTOMER" | "AGENT" | "SYSTEM"; authorName: string; body: string };

export function PortalConversation({
  ticketId,
  messages,
  isResolved,
  existingCsat,
}: {
  ticketId: string;
  messages: Message[];
  isResolved: boolean;
  existingCsat: { score: number; comment: string | null } | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [csatScore, setCsatScore] = useState(existingCsat?.score ?? 0);

  function send() {
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        await addPortalReply(ticketId, body);
        setBody("");
        router.refresh();
      } catch {
        toast.error("Could not send your reply.");
      }
    });
  }

  function rate(score: number) {
    setCsatScore(score);
    startTransition(async () => {
      try {
        await submitCsat(ticketId, score);
        toast.success("Thanks for your feedback!");
        router.refresh();
      } catch {
        toast.error("Could not submit feedback.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.authorType === "CUSTOMER" && "flex-row-reverse")}>
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className={cn("text-xs text-white", m.authorType === "CUSTOMER" ? "bg-slate-500" : "bg-cyan-600")}>{initials(m.authorName)}</AvatarFallback>
            </Avatar>
            <div className={cn("max-w-[75%]", m.authorType === "CUSTOMER" && "items-end flex flex-col")}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground">{m.authorName}</span>
                <span>{timeAgo(m.createdAt)}</span>
              </div>
              <div className={cn("rounded-xl px-3 py-2 text-sm whitespace-pre-wrap", m.authorType === "CUSTOMER" ? "bg-cyan-600 text-white" : "bg-muted")}>
                {m.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isResolved && (
        <div className="rounded-xl border bg-muted/30 p-4 text-center space-y-2">
          <p className="text-sm font-medium">How was your support experience?</p>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => rate(n)} disabled={isPending}>
                <Star className={cn("size-6 transition-colors", n <= csatScore ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          {existingCsat && <p className="text-xs text-muted-foreground">Thanks for your feedback!</p>}
        </div>
      )}

      <div className="flex items-end gap-2 border-t pt-3">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" rows={2} className="flex-1" />
        <Button onClick={send} disabled={isPending} aria-label="Send reply" className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
