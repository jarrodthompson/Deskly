import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, Mail, Phone, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/tickets/badges";
import { CompanySettingsForm } from "@/components/companies/company-settings-form";
import { ticketNumberLabel } from "@/lib/ticket-meta";
import { initials, timeAgo } from "@/lib/utils-format";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [company, slaPolicies, users] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { select: { id: true, name: true, email: true } },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true },
        },
        accountManager: { select: { id: true, name: true } },
        slaPolicy: { select: { id: true, name: true } },
        primaryContact: { select: { id: true, name: true } },
        _count: { select: { tickets: true } },
      },
    }),
    prisma.sLAPolicy.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!company) notFound();

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
          {company.industry && <span>{company.industry}</span>}
          {company.website && <span className="flex items-center gap-1"><Globe className="size-3.5" /> {company.website.replace(/^https?:\/\//, "")}</span>}
          {company.email && <span className="flex items-center gap-1"><Mail className="size-3.5" /> {company.email}</span>}
          {company.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" /> {company.phone}</span>}
          <span className="flex items-center gap-1"><Users className="size-3.5" /> {company.contacts.length} contacts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-sm font-medium">Recent Tickets ({company._count.tickets} total)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {company.tickets.map((t) => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                    <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticketNumberLabel(t.number)}</span>
                    <span className="flex-1 min-w-0 truncate text-sm">{t.subject}</span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                    <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{timeAgo(t.createdAt)}</span>
                  </Link>
                ))}
                {company.tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tickets yet.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-sm font-medium">Contacts</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {company.contacts.map((contact) => (
                <Link key={contact.id} href={`/customers/${contact.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors">
                  <Avatar className="size-7"><AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(contact.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{contact.name}{company.primaryContact?.id === contact.id && <span className="ml-1.5 text-[10px] uppercase text-cyan-600 dark:text-cyan-400 font-semibold">Primary</span>}</div>
                    <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                  </div>
                </Link>
              ))}
              {company.contacts.length === 0 && <p className="text-sm text-muted-foreground py-4">No contacts yet.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-none h-fit">
          <CardHeader><CardTitle className="text-sm font-medium">Account Settings</CardTitle></CardHeader>
          <CardContent>
            <CompanySettingsForm
              companyId={company.id}
              supportPlan={company.supportPlan}
              slaPolicyId={company.slaPolicyId}
              accountManagerId={company.accountManagerId}
              slaPolicies={slaPolicies}
              users={users}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
