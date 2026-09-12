"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { logAudit } from "@/lib/audit";
import { can, type StaffRole } from "@/lib/rbac";
import type { CustomFieldType } from "@prisma/client";

async function requireAdminSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff" || !can(session.user.role, "admin.users")) throw new Error("Forbidden");
  return session;
}

export async function createStaffUser(input: { name: string; email: string; password: string; role: StaffRole; teamId?: string | null; jobTitle?: string }) {
  const session = await requireAdminSession();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      roleKey: input.role,
      teamId: input.teamId || null,
      jobTitle: input.jobTitle || null,
    },
  });
  await logAudit({ actorUserId: session.user.id, action: "user.created", entityType: "User", entityId: user.id, metadata: { email: user.email, role: input.role } });
  revalidatePath("/admin/users");
  return user;
}

export async function setUserActive(userId: string, isActive: boolean) {
  const session = await requireAdminSession();
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await logAudit({ actorUserId: session.user.id, action: isActive ? "user.activated" : "user.deactivated", entityType: "User", entityId: userId });
  revalidatePath("/admin/users");
}

export async function setUserRole(userId: string, role: StaffRole) {
  const session = await requireAdminSession();
  await prisma.user.update({ where: { id: userId }, data: { roleKey: role } });
  await logAudit({ actorUserId: session.user.id, action: "user.role_changed", entityType: "User", entityId: userId, metadata: { role } });
  revalidatePath("/admin/users");
}

export async function toggleRolePermission(roleId: string, permissionId: string, enabled: boolean) {
  const session = await requireAdminSession();
  if (enabled) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  } else {
    await prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } }).catch(() => null);
  }
  await logAudit({ actorUserId: session.user.id, action: "role.permissions_updated", entityType: "Role", entityId: roleId, metadata: { permissionId, enabled } });
  revalidatePath("/admin/roles");
}

export async function createCategory(name: string, subcategoryNames: string[] = []) {
  const session = await requireAdminSession();
  const category = await prisma.category.create({
    data: { name, subcategories: { create: subcategoryNames.map((n) => ({ name: n })) } },
  });
  await logAudit({ actorUserId: session.user.id, action: "category.created", entityType: "Category", entityId: category.id, metadata: { name } });
  revalidatePath("/admin/categories");
  return category;
}

export async function deleteCategory(id: string) {
  const session = await requireAdminSession();
  await prisma.category.delete({ where: { id } });
  await logAudit({ actorUserId: session.user.id, action: "category.deleted", entityType: "Category", entityId: id });
  revalidatePath("/admin/categories");
}

export async function addSubcategory(categoryId: string, name: string) {
  await requireAdminSession();
  await prisma.subcategory.create({ data: { categoryId, name } });
  revalidatePath("/admin/categories");
}

export async function deleteSubcategory(id: string) {
  await requireAdminSession();
  await prisma.subcategory.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

export async function createCustomField(input: { name: string; fieldType: CustomFieldType; options: string[]; required: boolean }) {
  const session = await requireAdminSession();
  const field = await prisma.customFieldDefinition.create({ data: input });
  await logAudit({ actorUserId: session.user.id, action: "custom_field.created", entityType: "CustomFieldDefinition", entityId: field.id, metadata: { name: input.name } });
  revalidatePath("/admin/custom-fields");
  return field;
}

export async function deleteCustomField(id: string) {
  const session = await requireAdminSession();
  await prisma.customFieldDefinition.delete({ where: { id } });
  await logAudit({ actorUserId: session.user.id, action: "custom_field.deleted", entityType: "CustomFieldDefinition", entityId: id });
  revalidatePath("/admin/custom-fields");
}

export async function saveAppSetting(key: string, value: unknown) {
  const session = await requireAdminSession();
  await prisma.appSetting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never } });
  await logAudit({ actorUserId: session.user.id, action: "settings.updated", entityType: "AppSetting", entityId: key });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/email-settings");
}
