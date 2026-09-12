import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  GETTING_STARTED: "Getting Started", ACCOUNT: "Account", BILLING: "Billing",
  TECHNICAL_ISSUES: "Technical Issues", TROUBLESHOOTING: "Troubleshooting", INTEGRATIONS: "Integrations",
};

export default async function PortalKnowledgeBasePage() {
  const articles = await prisma.knowledgeBaseArticle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { views: "desc" },
  });

  const byCategory = new Map<string, typeof articles>();
  for (const a of articles) {
    byCategory.set(a.category, [...(byCategory.get(a.category) ?? []), a]);
  }

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Help Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Browse articles or search for answers.</p>
      </div>

      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{CATEGORY_LABELS[category] ?? category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((a) => (
              <Card key={a.id} className="shadow-none">
                <CardContent className="p-4 space-y-1.5">
                  <div className="font-medium text-sm">{a.title}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {a.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {articles.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No articles published yet.</p>}
    </div>
  );
}
