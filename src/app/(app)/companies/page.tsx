import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateCompanyDialog } from "@/components/companies/create-company-dialog";
import { OPEN_STATUSES } from "@/lib/ticket-meta";

const PLAN_STYLES: Record<string, string> = {
  BASIC: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  STANDARD: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  PREMIUM: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  ENTERPRISE: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
};

export default async function CompaniesPage() {
  const [companies, slaPolicies, users] = await Promise.all([
    prisma.company.findMany({
      include: {
        accountManager: { select: { name: true } },
        slaPolicy: { select: { name: true } },
        _count: { select: { contacts: true, tickets: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sLAPolicy.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const openCounts = await prisma.ticket.groupBy({ by: ["companyId", "status"], _count: true });
  const openByCompany = new Map<string, number>();
  for (const row of openCounts) {
    if (row.companyId && OPEN_STATUSES.includes(row.status)) {
      openByCompany.set(row.companyId, (openByCompany.get(row.companyId) ?? 0) + row._count);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{companies.length} companies</p>
        </div>
        <CreateCompanyDialog slaPolicies={slaPolicies} users={users} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <Link key={c.id} href={`/companies/${c.id}`}>
            <Card className="shadow-none h-full hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.industry ?? "—"}</div>
                  </div>
                  <Badge className={PLAN_STYLES[c.supportPlan]}>{c.supportPlan}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/50 py-1.5">
                    <div className="font-semibold text-sm tabular-nums">{c._count.contacts}</div>
                    <div className="text-muted-foreground">Contacts</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 py-1.5">
                    <div className="font-semibold text-sm tabular-nums">{openByCompany.get(c.id) ?? 0}</div>
                    <div className="text-muted-foreground">Open</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 py-1.5">
                    <div className="font-semibold text-sm tabular-nums">{c._count.tickets}</div>
                    <div className="text-muted-foreground">Total</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{c.slaPolicy?.name ?? "Default SLA"}</span>
                  <span>{c.accountManager?.name ?? "No manager"}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
