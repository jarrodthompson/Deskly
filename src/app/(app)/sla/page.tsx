import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateSlaPolicyDialog } from "@/components/sla/create-sla-policy-dialog";
import { SetDefaultButton } from "@/components/sla/set-default-button";
import { SlaRuleRow } from "@/components/sla/sla-rule-row";
import { PRIORITY_ORDER } from "@/lib/ticket-meta";
import { Separator } from "@/components/ui/separator";

export default async function SlaPage() {
  const policies = await prisma.sLAPolicy.findMany({
    include: { rules: true, _count: { select: { companies: true, tickets: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">SLA Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure first-response and resolution targets by priority.</p>
        </div>
        <CreateSlaPolicyDialog />
      </div>

      <div className="space-y-4">
        {policies.map((policy) => (
          <Card key={policy.id} className="shadow-none">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {policy.name}
                  {policy.isDefault && <Badge className="bg-cyan-600 text-white">Default</Badge>}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{policy._count.companies} companies · {policy._count.tickets} tickets using this policy</p>
              </div>
              {!policy.isDefault && <SetDefaultButton policyId={policy.id} />}
            </CardHeader>
            <CardContent className="divide-y">
              {PRIORITY_ORDER.slice().reverse().map((priority) => {
                const rule = policy.rules.find((r) => r.priority === priority);
                if (!rule) return null;
                return (
                  <SlaRuleRow
                    key={priority}
                    policyId={policy.id}
                    priority={priority}
                    firstResponseMinutes={rule.firstResponseMinutes}
                    resolutionMinutes={rule.resolutionMinutes}
                  />
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
