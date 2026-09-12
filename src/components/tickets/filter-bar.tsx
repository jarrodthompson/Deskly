"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_META, STATUS_META } from "@/lib/ticket-meta";

type Option = { id: string; name: string };

export function FilterBar({
  agents,
  teams,
  categories,
}: {
  agents: Option[];
  teams: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (q !== (searchParams.get("q") ?? "")) setParam("q", q || null);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = ["priority", "status", "agentId", "teamId", "categoryId", "sla", "tag"].some((k) => searchParams.get(k));

  function clearAll() {
    const params = new URLSearchParams();
    const tab = searchParams.get("tab");
    if (tab) params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
    setQ("");
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by ID, subject, customer…" className="pl-8 h-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <Select
          items={{ any: "Any status", ...Object.fromEntries(Object.entries(STATUS_META).map(([k, m]) => [k, m.label])) }}
          value={searchParams.get("status") ?? "any"}
          onValueChange={(v) => setParam("status", v === "any" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any status</SelectItem>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <SelectItem key={key} value={key}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{ any: "Any priority", ...Object.fromEntries(Object.entries(PRIORITY_META).map(([k, m]) => [k, m.label])) }}
          value={searchParams.get("priority") ?? "any"}
          onValueChange={(v) => setParam("priority", v === "any" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any priority</SelectItem>
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <SelectItem key={key} value={key}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{ any: "Any agent", ...Object.fromEntries(agents.map((a) => [a.id, a.name])) }}
          value={searchParams.get("agentId") ?? "any"}
          onValueChange={(v) => setParam("agentId", v === "any" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any agent</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{ any: "Any team", ...Object.fromEntries(teams.map((t) => [t.id, t.name])) }}
          value={searchParams.get("teamId") ?? "any"}
          onValueChange={(v) => setParam("teamId", v === "any" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Team" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any team</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{ any: "Any category", ...Object.fromEntries(categories.map((c) => [c.id, c.name])) }}
          value={searchParams.get("categoryId") ?? "any"}
          onValueChange={(v) => setParam("categoryId", v === "any" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            <X className="size-3.5" /> Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground mr-1"><SlidersHorizontal className="size-3" /> Saved views:</span>
        <SavedViewChip label="My Open Tickets" onClick={() => applyPreset(router, pathname, { tab: "mine" })} />
        <SavedViewChip label="Urgent Tickets" onClick={() => applyPreset(router, pathname, { priority: "URGENT,CRITICAL" })} />
        <SavedViewChip label="Unassigned Tickets" onClick={() => applyPreset(router, pathname, { tab: "unassigned" })} />
        <SavedViewChip label="SLA At Risk" onClick={() => applyPreset(router, pathname, { sla: "at_risk" })} />
        <SavedViewChip label="Payment Issues" onClick={() => applyPreset(router, pathname, { tag: "Payment Issue" })} />
      </div>
    </div>
  );
}

function applyPreset(router: ReturnType<typeof useRouter>, pathname: string, preset: Record<string, string>) {
  const params = new URLSearchParams(preset);
  router.push(`${pathname}?${params.toString()}`);
}

function SavedViewChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
    >
      {label}
    </button>
  );
}
