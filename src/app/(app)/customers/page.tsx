import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateCustomerDialog } from "@/components/customers/create-customer-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { initials } from "@/lib/utils-format";
import { OPEN_STATUSES } from "@/lib/ticket-meta";

export default async function CustomersPage() {
  const [customers, companies, ticketCounts, csatByCustomer] = await Promise.all([
    prisma.customer.findMany({
      include: { company: { select: { name: true } }, _count: { select: { tickets: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.ticket.groupBy({ by: ["customerId", "status"], _count: true }),
    prisma.customerSatisfaction.groupBy({ by: ["customerId"], _avg: { score: true } }),
  ]);

  const openByCustomer = new Map<string, number>();
  for (const row of ticketCounts) {
    if (OPEN_STATUSES.includes(row.status)) {
      openByCustomer.set(row.customerId, (openByCustomer.get(row.customerId) ?? 0) + row._count);
    }
  }
  const csatMap = new Map(csatByCustomer.map((c) => [c.customerId, c._avg.score]));

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} customers</p>
        </div>
        <CreateCustomerDialog companies={companies} />
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Customer</th>
                <th className="px-4 py-2.5 text-left font-medium">Company</th>
                <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Phone</th>
                <th className="px-4 py-2.5 text-left font-medium hidden lg:table-cell">Location</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Tickets</th>
                <th className="px-4 py-2.5 text-left font-medium">Open</th>
                <th className="px-4 py-2.5 text-left font-medium">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-2.5 hover:underline">
                      <Avatar className="size-8">
                        <AvatarImage src={c.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c.company?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap hidden md:table-cell">{c.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">{c.location ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={c.accountStatus === "ACTIVE" ? "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "text-muted-foreground"}>
                      {c.accountStatus === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{c._count.tickets}</td>
                  <td className="px-4 py-2.5 tabular-nums">{openByCustomer.get(c.id) ?? 0}</td>
                  <td className="px-4 py-2.5">
                    {csatMap.get(c.id) ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Star className="size-3.5 fill-current" /> {csatMap.get(c.id)!.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
