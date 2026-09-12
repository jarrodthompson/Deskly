import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { subcategories: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ticket Categories</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Organize tickets by category and subcategory.</p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
