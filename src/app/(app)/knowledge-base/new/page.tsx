import { ArticleForm } from "@/components/kb/article-form";

export default function NewArticlePage() {
  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">New Article</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Publish a knowledge base article for customers and agents.</p>
      </div>
      <ArticleForm />
    </div>
  );
}
