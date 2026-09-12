"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import type { SupportPlan } from "@prisma/client";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

export async function createCompany(input: {
  name: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  supportPlan: SupportPlan;
  slaPolicyId?: string | null;
  accountManagerId?: string | null;
}) {
  await requireStaffSession();
  const company = await prisma.company.create({
    data: {
      name: input.name,
      industry: input.industry || null,
      website: input.website || null,
      email: input.email || null,
      phone: input.phone || null,
      supportPlan: input.supportPlan,
      slaPolicyId: input.slaPolicyId || null,
      accountManagerId: input.accountManagerId || null,
    },
  });
  revalidatePath("/companies");
  return company;
}

export async function updateCompany(
  companyId: string,
  input: Partial<{ supportPlan: SupportPlan; slaPolicyId: string | null; accountManagerId: string | null; primaryContactId: string | null }>
) {
  await requireStaffSession();
  await prisma.company.update({ where: { id: companyId }, data: input });
  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
}
