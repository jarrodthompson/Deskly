"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus, UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserTeam } from "@/lib/actions/teams";
import { initials } from "@/lib/utils-format";

type Member = { id: string; name: string; email: string; avatarUrl: string | null; jobTitle: string | null };

export function TeamMembersManager({ teamId, members, availableUsers }: { teamId: string; members: Member[]; availableUsers: Member[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState("");
  const [isPending, startTransition] = useTransition();

  function remove(userId: string) {
    startTransition(async () => {
      try {
        await setUserTeam(userId, null);
        toast.success("Removed from team.");
        router.refresh();
      } catch {
        toast.error("Could not remove member.");
      }
    });
  }

  function add(userId: string) {
    startTransition(async () => {
      try {
        await setUserTeam(userId, teamId);
        toast.success("Added to team.");
        setAdding("");
        router.refresh();
      } catch {
        toast.error("Could not add member.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
            <Avatar className="size-8">
              <AvatarImage src={m.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{m.name}</div>
              <div className="text-xs text-muted-foreground truncate">{m.jobTitle ?? m.email}</div>
            </div>
            <Button size="icon-sm" variant="ghost" aria-label="Remove from team" disabled={isPending} onClick={() => remove(m.id)}>
              <UserMinus className="size-3.5" />
            </Button>
          </div>
        ))}
        {members.length === 0 && <p className="text-sm text-muted-foreground py-2">No members yet.</p>}
      </div>

      {availableUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            items={{ none: "Add a member…", ...Object.fromEntries(availableUsers.map((u) => [u.id, u.name])) }}
            value={adding || "none"}
            onValueChange={(v) => setAdding(v === "none" ? "" : v)}
          >
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Add a member…</SelectItem>
              {availableUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!adding || isPending} onClick={() => add(adding)} className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0">
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />} Add
          </Button>
        </div>
      )}
    </div>
  );
}
