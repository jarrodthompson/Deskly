"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

export async function createTeam(input: { name: string; description?: string }) {
  await requireStaffSession();
  const team = await prisma.team.create({ data: { name: input.name, description: input.description || null } });
  revalidatePath("/teams");
  return team;
}

export async function setUserTeam(userId: string, teamId: string | null) {
  await requireStaffSession();
  await prisma.user.update({ where: { id: userId }, data: { teamId } });
  revalidatePath("/teams");
  revalidatePath("/agents");
}

export async function updateTeam(teamId: string, input: { name: string; description?: string }) {
  await requireStaffSession();
  await prisma.team.update({ where: { id: teamId }, data: { name: input.name, description: input.description || null } });
  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
}
