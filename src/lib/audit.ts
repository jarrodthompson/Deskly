import { prisma } from "@/lib/prisma";

export async function logAudit(input: { actorUserId?: string; actorCustomerId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }) {
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
