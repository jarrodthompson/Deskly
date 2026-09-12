"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCheck,
  MessageCircle,
  AtSign,
  ArrowUpCircle,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  Flag,
  Bell,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { timeAgo } from "@/lib/utils-format";
import type { NotificationType } from "@prisma/client";

const ICONS: Record<NotificationType, typeof Bell> = {
  TICKET_ASSIGNED: UserCheck,
  CUSTOMER_REPLIED: MessageCircle,
  AGENT_MENTIONED: AtSign,
  TICKET_ESCALATED: ArrowUpCircle,
  SLA_AT_RISK: AlertTriangle,
  SLA_BREACHED: ShieldAlert,
  TICKET_REOPENED: RotateCcw,
  PRIORITY_CRITICAL: Flag,
};

type Notification = { id: string; type: NotificationType; title: string; body: string; isRead: boolean; createdAt: Date; ticketId: string | null };

export function NotificationList({ notifications, basePath }: { notifications: Notification[]; basePath: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await markAllNotificationsRead();
                  router.refresh();
                } catch {
                  toast.error("Could not mark as read.");
                }
              })
            }
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        </div>
      )}
      <div className="divide-y rounded-xl border bg-card">
        {notifications.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          const content = (
            <div className={cn("flex items-start gap-3 px-4 py-3 transition-colors", !n.isRead && "bg-cyan-50/50 dark:bg-cyan-500/5", n.ticketId && "hover:bg-muted/40 cursor-pointer")}>
              <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", !n.isRead ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300" : "bg-muted text-muted-foreground")}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{n.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="size-2 rounded-full bg-cyan-600 shrink-0 mt-1.5" />}
            </div>
          );

          return n.ticketId ? (
            <Link
              key={n.id}
              href={`${basePath}/${n.ticketId}`}
              onClick={() => {
                if (!n.isRead) startTransition(() => markNotificationRead(n.id));
              }}
            >
              {content}
            </Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
        {notifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">You&apos;re all caught up.</p>}
      </div>
    </div>
  );
}
