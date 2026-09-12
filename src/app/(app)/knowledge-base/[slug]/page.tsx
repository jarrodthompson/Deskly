import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/kb/article-form";
import { Eye, ThumbsUp, ThumbsDown } from "lucide-react";

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.knowledgeBaseArticle.findUnique({ where: { slug } });
  if (!article) notFound();

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{article.title}</h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Eye className="size-3.5" /> {article.views} views</span>
          <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" /> {article.helpfulYes}</span>
          <span className="flex items-center gap-1"><ThumbsDown className="size-3.5" /> {article.helpfulNo}</span>
        </div>
      </div>
      <ArticleForm article={{ id: article.id, title: article.title, category: article.category, content: article.content, tags: article.tags, status: article.status }} />
    </div>
  );
}
