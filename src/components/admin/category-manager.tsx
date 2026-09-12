"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCategory, deleteCategory, addSubcategory, deleteSubcategory } from "@/lib/actions/admin";

type Category = { id: string; name: string; subcategories: { id: string; name: string }[] };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});

  function createNew() {
    if (!newName.trim()) return;
    startTransition(async () => {
      try {
        await createCategory(newName);
        setNewName("");
        toast.success("Category created.");
        router.refresh();
      } catch {
        toast.error("Could not create category. It may already exist.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" onKeyDown={(e) => e.key === "Enter" && createNew()} />
        <Button onClick={createNew} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0">
          <Plus className="size-4" /> Add
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="shadow-none">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{cat.name}</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete category"
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteCategory(cat.id);
                        toast.success("Category deleted.");
                        router.refresh();
                      } catch {
                        toast.error("Could not delete — it may still have tickets.");
                      }
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.subcategories.map((sub) => (
                  <Badge key={sub.id} variant="outline" className="gap-1">
                    {sub.name}
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          await deleteSubcategory(sub.id);
                          router.refresh();
                        })
                      }
                      className="hover:text-destructive"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  value={subInputs[cat.id] ?? ""}
                  onChange={(e) => setSubInputs({ ...subInputs, [cat.id]: e.target.value })}
                  placeholder="Add subcategory…"
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && subInputs[cat.id]?.trim()) {
                      startTransition(async () => {
                        await addSubcategory(cat.id, subInputs[cat.id]);
                        setSubInputs({ ...subInputs, [cat.id]: "" });
                        router.refresh();
                      });
                    }
                  }}
                />
                {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
