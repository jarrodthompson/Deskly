import { prisma } from "@/lib/prisma";
import { CustomFieldManager } from "@/components/admin/custom-field-manager";

export default async function CustomFieldsPage() {
  const fields = await prisma.customFieldDefinition.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Custom Fields</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Define additional fields your team can capture on tickets.</p>
      </div>
      <CustomFieldManager fields={fields} />
    </div>
  );
}
