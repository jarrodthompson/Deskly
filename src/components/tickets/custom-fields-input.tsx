"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomFieldType } from "@prisma/client";

export type CustomFieldDef = { id: string; name: string; fieldType: CustomFieldType; options: string[]; required: boolean };

export function CustomFieldsInput({
  fields,
  values,
  onChange,
}: {
  fields: CustomFieldDef[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.name} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.fieldType === "TEXT" && (
            <Input value={values[field.id] ?? ""} onChange={(e) => onChange(field.id, e.target.value)} required={field.required} />
          )}
          {field.fieldType === "NUMBER" && (
            <Input type="number" value={values[field.id] ?? ""} onChange={(e) => onChange(field.id, e.target.value)} required={field.required} />
          )}
          {field.fieldType === "DATE" && (
            <Input type="date" value={values[field.id] ?? ""} onChange={(e) => onChange(field.id, e.target.value)} required={field.required} />
          )}
          {field.fieldType === "DROPDOWN" && (
            <Select
              items={Object.fromEntries(field.options.map((o) => [o, o]))}
              value={values[field.id] ?? ""}
              onValueChange={(v) => onChange(field.id, v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {field.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {field.fieldType === "CHECKBOX" && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={values[field.id] === "true"} onCheckedChange={(v) => onChange(field.id, v ? "true" : "false")} />
              Yes
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
