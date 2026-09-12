import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const session = await auth();
  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Assignments, replies, mentions and SLA alerts.</p>
      </div>
      <NotificationList notifications={notifications} basePath="/tickets" />
    </div>
  );
}
