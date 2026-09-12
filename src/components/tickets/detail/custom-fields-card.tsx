"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setTicketCustomFieldValue } from "@/lib/actions/tickets";
import type { CustomFieldType } from "@prisma/client";

type Field = { id: string; name: string; fieldType: CustomFieldType; options: string[] };

export function CustomFieldsCard({ ticketId, fields, values }: { ticketId: string; fields: Field[]; values: Record<string, string> }) {
  const router = useRouter();
  const [local, setLocal] = useState(values);
  const [isPending, startTransition] = useTransition();

  if (fields.length === 0) return null;

  function save(fieldId: string, value: string) {
    setLocal((prev) => ({ ...prev, [fieldId]: value }));
    startTransition(async () => {
      try {
        await setTicketCustomFieldValue(ticketId, fieldId, value);
        router.refresh();
      } catch {
        toast.error("Could not save field.");
      }
    });
  }

  return (
    <Card className="shadow-none">
      <CardHeader><CardTitle className="text-sm font-medium">Additional Information</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <div className="text-xs text-muted-foreground">{field.name}</div>
            {field.fieldType === "CHECKBOX" ? (
              <Checkbox
                checked={local[field.id] === "true"}
                disabled={isPending}
                onCheckedChange={(v) => save(field.id, v ? "true" : "false")}
              />
            ) : field.fieldType === "DROPDOWN" ? (
              <Select
                items={{ none: "—", ...Object.fromEntries(field.options.map((o) => [o, o])) }}
                value={local[field.id] || "none"}
                disabled={isPending}
                onValueChange={(v) => save(field.id, v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {field.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : "text"}
                defaultValue={local[field.id] ?? ""}
                disabled={isPending}
                onBlur={(e) => {
                  if (e.target.value !== (values[field.id] ?? "")) save(field.id, e.target.value);
                }}
                className="h-8"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
