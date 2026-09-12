"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import type { AccountStatus } from "@prisma/client";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

export type CreateCustomerInput = {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  companyId?: string | null;
  notes?: string;
};

export async function createCustomer(input: CreateCustomerInput) {
  await requireStaffSession();
  const customer = await prisma.customer.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      location: input.location || null,
      companyId: input.companyId || null,
      notes: input.notes || null,
    },
  });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomerStatus(customerId: string, accountStatus: AccountStatus) {
  await requireStaffSession();
  await prisma.customer.update({ where: { id: customerId }, data: { accountStatus } });
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function updateCustomerNotes(customerId: string, notes: string) {
  await requireStaffSession();
  await prisma.customer.update({ where: { id: customerId }, data: { notes } });
  revalidatePath(`/customers/${customerId}`);
}

export async function createCustomerQuick(data: { name: string; email: string; phone?: string; companyId?: string | null }) {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");

  const existing = await prisma.customer.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return existing;

  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      companyId: data.companyId || null,
    },
  });
}
