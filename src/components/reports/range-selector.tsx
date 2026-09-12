"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RANGE_OPTIONS } from "@/lib/report-ranges";
import { cn } from "cn";

export function RangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "7d";

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => router.push(`${pathname}?range=${opt.key}`)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            current === opt.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
