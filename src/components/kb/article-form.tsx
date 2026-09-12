"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createArticle, updateArticle, deleteArticle } from "@/lib/actions/kb";
import type { ArticleCategory, ArticleStatus } from "@prisma/client";

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  GETTING_STARTED: "Getting Started", ACCOUNT: "Account", BILLING: "Billing",
  TECHNICAL_ISSUES: "Technical Issues", TROUBLESHOOTING: "Troubleshooting", INTEGRATIONS: "Integrations",
};

export function ArticleForm({
  article,
}: {
  article?: { id: string; title: string; category: ArticleCategory; content: string; tags: string[]; status: ArticleStatus };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState<ArticleCategory>(article?.category ?? "GETTING_STARTED");
  const [content, setContent] = useState(article?.content ?? "");
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? "DRAFT");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    startTransition(async () => {
      try {
        if (article) {
          await updateArticle(article.id, { title, category, content, tags: tagList, status });
          toast.success("Article updated.");
          router.refresh();
        } else {
          await createArticle({ title, category, content, tags: tagList, status });
        }
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Something went wrong.");
      }
    });
  }

  function remove() {
    if (!article) return;
    startTransition(async () => {
      try {
        await deleteArticle(article.id);
        toast.success("Article deleted.");
        router.push("/knowledge-base");
      } catch {
        toast.error("Could not delete article.");
      }
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select items={CATEGORY_LABELS} value={category} onValueChange={(v) => setCategory(v as ArticleCategory)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select items={{ DRAFT: "Draft", PUBLISHED: "Published" }} value={status} onValueChange={(v) => setStatus(v as ArticleStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tags (comma separated)</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="password, login, security" />
      </div>
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} placeholder="Write the article content…" />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {article ? "Save changes" : "Create article"}
        </Button>
        {article && (
          <Button variant="destructive" onClick={remove} disabled={isPending}>Delete</Button>
        )}
      </div>
    </div>
  );
}
