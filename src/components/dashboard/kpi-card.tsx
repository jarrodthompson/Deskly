import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "default",
  invertTrendColor = false,
}: {
  label: string;
  value: number | string;
  change: number | null;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
  invertTrendColor?: boolean;
}) {
  const positive = (change ?? 0) > 0;
  const negative = (change ?? 0) < 0;
  const goodDirection = invertTrendColor ? negative : positive;
  const badDirection = invertTrendColor ? positive : negative;

  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground truncate">{label}</div>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
          </div>
          <div
            className={cn(
              "shrink-0 size-9 rounded-lg flex items-center justify-center",
              tone === "danger" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" :
              tone === "warning" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
              "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
            )}
          >
            <Icon className="size-[18px]" />
          </div>
        </div>
        {change !== null ? (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                change === 0 ? "text-muted-foreground" : goodDirection ? "text-emerald-600 dark:text-emerald-400" : badDirection ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}
            >
              {change > 0 ? <ArrowUp className="size-3" /> : change < 0 ? <ArrowDown className="size-3" /> : <Minus className="size-3" />}
              {Math.abs(change)}%
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        ) : (
          <div className="mt-2 text-xs text-muted-foreground">No data last week</div>
        )}
      </CardContent>
    </Card>
  );
}
