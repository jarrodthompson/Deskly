"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  if (session.user.kind === "staff") {
    await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { customerId: session.user.id, isRead: false }, data: { isRead: true } });
  }
  revalidatePath("/notifications");
}
