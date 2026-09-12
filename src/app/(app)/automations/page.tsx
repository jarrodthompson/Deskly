import { prisma } from "@/lib/prisma";
import { CreateAutomationDialog } from "@/components/automations/create-automation-dialog";
import { AutomationCard } from "@/components/automations/automation-card";

export default async function AutomationsPage() {
  const [automations, categories, companies, teams, agents, tags] = await Promise.all([
    prisma.automation.findMany({
      include: { actions: true, _count: { select: { executions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Rules run automatically when a new ticket is created.</p>
        </div>
        <CreateAutomationDialog categories={categories} companies={companies} teams={teams} agents={agents} tags={tags} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((a) => (
          <AutomationCard
            key={a.id}
            automation={{
              id: a.id,
              name: a.name,
              description: a.description,
              isActive: a.isActive,
              conditions: a.conditions,
              actions: a.actions,
              executions: a._count.executions,
            }}
          />
        ))}
        {automations.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center col-span-2">No automations yet.</p>}
      </div>
    </div>
  );
}
