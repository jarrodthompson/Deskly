"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomField, deleteCustomField } from "@/lib/actions/admin";
import type { CustomFieldType } from "@prisma/client";

const TYPE_LABELS: Record<CustomFieldType, string> = { TEXT: "Text", NUMBER: "Number", DATE: "Date", DROPDOWN: "Dropdown", CHECKBOX: "Checkbox" };

type Field = { id: string; name: string; fieldType: CustomFieldType; options: string[]; required: boolean };

export function CustomFieldManager({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("TEXT");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  const [isPending, startTransition] = useTransition();

  function create() {
    if (!name.trim()) return toast.error("Field name is required.");
    startTransition(async () => {
      try {
        await createCustomField({
          name,
          fieldType,
          options: fieldType === "DROPDOWN" ? options.split(",").map((o) => o.trim()).filter(Boolean) : [],
          required,
        });
        setName(""); setOptions(""); setRequired(false);
        toast.success("Custom field created.");
        router.refresh();
      } catch {
        toast.error("Could not create field. The name may already exist.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none max-w-xl">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Field name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Order Number" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select items={TYPE_LABELS} value={fieldType} onValueChange={(v) => setFieldType(v as CustomFieldType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {fieldType === "DROPDOWN" && (
            <div className="space-y-1.5">
              <Label>Options (comma separated)</Label>
              <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Option A, Option B, Option C" />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={required} onCheckedChange={(v) => setRequired(!!v)} /> Required field
          </label>
          <Button onClick={create} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add field
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2 max-w-xl">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{f.name} {f.required && <span className="text-red-500">*</span>}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[f.fieldType]}</Badge>
                {f.options.map((o) => <Badge key={o} variant="outline" className="text-[10px]">{o}</Badge>)}
              </div>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete field"
              onClick={() =>
                startTransition(async () => {
                  await deleteCustomField(f.id);
                  toast.success("Field deleted.");
                  router.refresh();
                })
              }
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && <p className="text-sm text-muted-foreground">No custom fields defined yet.</p>}
      </div>
    </div>
  );
}
