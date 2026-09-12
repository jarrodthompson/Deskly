"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, Send, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttachmentUploader, type UploadedFile } from "@/components/shared/attachment-uploader";
import { addReply, addNote } from "@/lib/actions/tickets";
import { initials, timeAgo, fileSizeLabel } from "@/lib/utils-format";
import { cn } from "cn";

type Attachment = { id: string; fileName: string; fileUrl: string; fileSize: number };

type Message = {
  id: string;
  kind: "message";
  createdAt: Date;
  authorType: "CUSTOMER" | "AGENT" | "SYSTEM";
  authorName: string;
  authorAvatar: string | null;
  body: string;
  attachments: Attachment[];
};

type Note = {
  id: string;
  kind: "note";
  createdAt: Date;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  attachments: Attachment[];
};

export function ConversationPanel({
  ticketId,
  entries,
  agents,
}: {
  ticketId: string;
  entries: (Message | Note)[];
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"reply" | "note">("reply");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [mentioned, setMentioned] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(() => [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()), [entries]);

  function toggleMention(id: string) {
    setMentioned((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function submit() {
    if (!body.trim()) {
      toast.error("Write something before sending.");
      return;
    }
    startTransition(async () => {
      try {
        if (tab === "reply") {
          await addReply(ticketId, body, attachments);
          toast.success("Reply sent to customer.");
        } else {
          await addNote(ticketId, body, mentioned, attachments);
          toast.success("Internal note added.");
        }
        setBody("");
        setAttachments([]);
        setMentioned([]);
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
        {sorted.map((entry) => (
          <EntryBubble key={`${entry.kind}-${entry.id}`} entry={entry} />
        ))}
        {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No messages yet.</p>}
      </div>

      <div className="border-t p-3 md:p-4 space-y-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "reply" | "note")}>
          <TabsList variant="line">
            <TabsTrigger value="reply">Reply to Customer</TabsTrigger>
            <TabsTrigger value="note">Internal Note</TabsTrigger>
          </TabsList>
        </Tabs>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={tab === "reply" ? "Write a reply to the customer…" : "Write an internal note (not visible to the customer)…"}
          rows={4}
          className={cn(tab === "note" && "border-amber-300 bg-amber-50/50 dark:bg-amber-500/5 dark:border-amber-500/30")}
        />

        {tab === "note" && agents.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Notify:</span>
            {agents.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleMention(a.id)}
                className={cn(
                  "rounded-full border px-2 py-0.5 transition-colors",
                  mentioned.includes(a.id) ? "bg-amber-500 text-white border-amber-500" : "bg-background hover:bg-muted"
                )}
              >
                @{a.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <AttachmentUploader files={attachments} onChange={setAttachments} compact />
          <Button
            onClick={submit}
            disabled={isPending}
            className={tab === "reply" ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : tab === "note" ? <Lock className="size-4" /> : <Send className="size-4" />}
            {tab === "reply" ? "Send Reply" : "Add Note"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EntryBubble({ entry }: { entry: Message | Note }) {
  const isNote = entry.kind === "note";
  const isCustomer = entry.kind === "message" && entry.authorType === "CUSTOMER";

  return (
    <div className={cn("flex gap-2.5", isNote && "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3")}>
      <Avatar className="size-8 shrink-0 mt-0.5">
        <AvatarImage src={entry.authorAvatar ?? undefined} />
        <AvatarFallback className={cn("text-xs text-white", isNote ? "bg-amber-500" : isCustomer ? "bg-slate-500" : "bg-cyan-600")}>
          {initials(entry.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{entry.authorName}</span>
          {isNote && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <Lock className="size-2.5" /> INTERNAL NOTE
            </span>
          )}
          {isCustomer && <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Customer</span>}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(entry.createdAt)}</span>
        </div>
        <div
          className={cn(
            "mt-1 rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
            isNote ? "bg-transparent p-0" : isCustomer ? "bg-muted" : "bg-cyan-50 dark:bg-cyan-500/10"
          )}
        >
          {entry.body}
        </div>
        {entry.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {entry.attachments.map((a) => (
              <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-1 text-xs hover:bg-muted transition-colors">
                <FileText className="size-3.5 text-muted-foreground" />
                {a.fileName}
                <span className="text-muted-foreground">{fileSizeLabel(a.fileSize)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
