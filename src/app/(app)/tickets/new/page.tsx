import { prisma } from "@/lib/prisma";
import { CreateTicketForm } from "@/components/tickets/create-ticket-form";

export default async function NewTicketPage() {
  const [customers, companies, categories, teams, agents, tags, customFields] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, name: true, email: true, company: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({
      select: { id: true, name: true, subcategories: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customFieldDefinition.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const customerOptions = customers.map((c) => ({ id: c.id, name: c.name, email: c.email, companyName: c.company?.name ?? null }));

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Create Ticket</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Log a new support request on behalf of a customer.</p>
      </div>
      <CreateTicketForm
        customers={customerOptions}
        companies={companies}
        categories={categories}
        teams={teams}
        agents={agents}
        tags={tags}
        customFields={customFields}
      />
    </div>
  );
}
