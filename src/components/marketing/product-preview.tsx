import { Ticket, FolderOpen, Loader2, CheckCircle2 } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="rounded-2xl border bg-card shadow-xl shadow-slate-900/5 overflow-hidden">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-muted-foreground">app.deskly.io/dashboard</span>
      </div>
      <div className="flex">
        <div className="hidden sm:flex w-14 flex-col items-center gap-3 border-r bg-slate-900 py-4">
          <div className="size-6 rounded-md bg-gradient-to-br from-cyan-400 to-cyan-600" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`size-6 rounded-md ${i === 0 ? "bg-cyan-600" : "bg-slate-700"}`} />
          ))}
        </div>
        <div className="flex-1 p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { icon: Ticket, label: "Total", value: "36" },
              { icon: FolderOpen, label: "Open", value: "8" },
              { icon: Loader2, label: "In Progress", value: "7" },
              { icon: CheckCircle2, label: "Resolved", value: "7" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border bg-background p-2.5">
                <s.icon className="size-3.5 text-cyan-600 mb-1.5" />
                <div className="text-sm font-semibold tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-end gap-1.5 h-16">
              {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-cyan-600 to-cyan-400" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {["Payment gateway returning timeout", "Customer unable to reset password", "Microsoft 365 mailbox not syncing"].map((row) => (
              <div key={row} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                <span className="size-1.5 rounded-full bg-cyan-500 shrink-0" />
                <span className="text-xs truncate flex-1">{row}</span>
                <span className="hidden sm:inline text-[10px] rounded-full bg-amber-50 text-amber-700 px-1.5 py-0.5">In Progress</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
