"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import type { ArticleCategory, ArticleStatus } from "@prisma/client";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createArticle(input: { title: string; category: ArticleCategory; content: string; tags: string[]; status: ArticleStatus }) {
  const session = await requireStaffSession();
  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.knowledgeBaseArticle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`;
  }
  const article = await prisma.knowledgeBaseArticle.create({
    data: {
      title: input.title,
      slug,
      category: input.category,
      content: input.content,
      tags: input.tags,
      status: input.status,
      authorId: session.user.id,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
  });
  revalidatePath("/knowledge-base");
  redirect(`/knowledge-base/${article.slug}`);
}

export async function updateArticle(id: string, input: Partial<{ title: string; category: ArticleCategory; content: string; tags: string[]; status: ArticleStatus }>) {
  await requireStaffSession();
  const existing = await prisma.knowledgeBaseArticle.findUniqueOrThrow({ where: { id } });
  await prisma.knowledgeBaseArticle.update({
    where: { id },
    data: {
      ...input,
      publishedAt: input.status === "PUBLISHED" && !existing.publishedAt ? new Date() : undefined,
    },
  });
  revalidatePath("/knowledge-base");
  revalidatePath(`/knowledge-base/${existing.slug}`);
}

export async function deleteArticle(id: string) {
  await requireStaffSession();
  await prisma.knowledgeBaseArticle.delete({ where: { id } });
  revalidatePath("/knowledge-base");
}

export async function incrementArticleViews(id: string) {
  await prisma.knowledgeBaseArticle.update({ where: { id }, data: { views: { increment: 1 } } });
}

export async function voteArticleHelpful(id: string, helpful: boolean) {
  await prisma.knowledgeBaseArticle.update({
    where: { id },
    data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
  });
  revalidatePath(`/knowledge-base/${id}`);
}
