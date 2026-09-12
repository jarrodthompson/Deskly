import Link from "next/link";
import { cn } from "cn";

const TABS = [
  { key: "all", label: "All" },
  { key: "mine", label: "My Tickets" },
  { key: "unassigned", label: "Unassigned" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
] as const;

export function InboxTabs({
  activeTab,
  counts,
  buildHref,
}: {
  activeTab: string;
  counts: Record<string, number>;
  buildHref: (tab: string) => string;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b -mb-px">
      {TABS.map((tab) => {
        const active = activeTab === tab.key || (tab.key === "all" && !activeTab);
        return (
          <Link
            key={tab.key}
            href={buildHref(tab.key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "border-cyan-600 text-cyan-700 dark:text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", active ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300" : "bg-muted text-muted-foreground")}>
              {counts[tab.key] ?? 0}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
