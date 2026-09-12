import Link from "next/link";
import { Plus, Eye, ThumbsUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS: Record<string, string> = {
  GETTING_STARTED: "Getting Started",
  ACCOUNT: "Account",
  BILLING: "Billing",
  TECHNICAL_ISSUES: "Technical Issues",
  TROUBLESHOOTING: "Troubleshooting",
  INTEGRATIONS: "Integrations",
};

export default async function KnowledgeBasePage() {
  const articles = await prisma.knowledgeBaseArticle.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{articles.length} articles</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/knowledge-base/new" />}>
          <Plus className="size-4" /> New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((a) => (
          <Link key={a.id} href={`/knowledge-base/${a.slug}`}>
            <Card className="shadow-none h-full hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-colors">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[a.category]}</Badge>
                  <Badge className={a.status === "PUBLISHED" ? "bg-emerald-600 text-white" : "bg-slate-400 text-white"}>{a.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                </div>
                <div className="font-medium line-clamp-2">{a.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Eye className="size-3.5" /> {a.views}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" /> {a.helpfulYes}</span>
                  <span className="ml-auto">{a.author.name}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {articles.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center col-span-3">No articles yet.</p>}
      </div>
    </div>
  );
}
