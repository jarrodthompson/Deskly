import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { StaffRole } from "@/lib/rbac";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.kind !== "staff") {
    redirect("/sign-in");
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role as StaffRole,
  };

  return (
    <div className="flex min-h-svh w-full bg-background">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header user={user} unreadCount={unreadCount} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
