import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils-format";
import { Star } from "lucide-react";

export function AgentPerformanceTable({
  agents,
}: {
  agents: { id: string; name: string; avatarUrl: string | null; open: number; resolved: number; csat: number | null }[];
}) {
  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No assigned tickets yet.</p>;
  }
  return (
    <div className="space-y-1">
      {agents.map((agent) => (
        <div key={agent.id} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors">
          <Avatar className="size-8">
            <AvatarImage src={agent.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(agent.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.open} open · {agent.resolved} resolved</div>
          </div>
          {agent.csat !== null && (
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0">
              <Star className="size-3.5 fill-current" />
              {agent.csat.toFixed(1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
