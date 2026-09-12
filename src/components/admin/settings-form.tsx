"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveAppSetting } from "@/lib/actions/admin";

export type SettingField = { key: string; label: string; placeholder?: string; type?: string; helpText?: string };

export function SettingsForm({ settingKey, fields, initialValues }: { settingKey: string; fields: SettingField[]; initialValues: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await saveAppSetting(settingKey, values);
        toast.success("Settings saved.");
        router.refresh();
      } catch {
        toast.error("Could not save settings.");
      }
    });
  }

  return (
    <Card className="shadow-none max-w-xl">
      <CardContent className="p-5 space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              type={f.type ?? "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder}
            />
            {f.helpText && <p className="text-xs text-muted-foreground">{f.helpText}</p>}
          </div>
        ))}
        <Button onClick={save} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          {isPending && <Loader2 className="size-4 animate-spin" />} Save settings
        </Button>
      </CardContent>
    </Card>
  );
}
