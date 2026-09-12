import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(input: { actorUserId?: string; actorCustomerId?: string; action: string; entityType: string; entityId?: string; metadata?: Prisma.InputJsonObject }) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorCustomerId: input.actorCustomerId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
