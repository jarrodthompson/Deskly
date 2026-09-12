import { describeEvent } from "@/lib/ticket-events-format";
import { timeAgo } from "@/lib/utils-format";
import type { TicketEventType } from "@prisma/client";

type Event = {
  id: string;
  type: TicketEventType;
  createdAt: Date;
  actorUser: { name: string } | null;
  fromValue: string | null;
  toValue: string | null;
};

export function ActivityTimeline({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No activity yet.</p>;
  }

  return (
    <div className="p-4 md:p-5 space-y-4">
      {events.map((event, i) => {
        const { text, icon: Icon } = describeEvent(event);
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm">{text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(event.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
