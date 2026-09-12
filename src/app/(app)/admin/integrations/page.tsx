import { Mail, MessageSquare, Webhook, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const INTEGRATIONS = [
  { icon: Mail, name: "Email (SMTP/IMAP)", description: "Turn inbound emails into tickets and send replies from the app.", href: "/admin/email-settings" },
  { icon: Hash, name: "Slack", description: "Get notified in Slack when tickets are created, assigned or escalated.", href: null },
  { icon: Webhook, name: "Webhooks", description: "Send ticket events to external systems as they happen.", href: null },
  { icon: MessageSquare, name: "Live Chat Widget", description: "Embed a chat widget on your site that creates tickets.", href: null },
];

export default function IntegrationsPage() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect external tools to your helpdesk.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.name} className="shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <integration.icon className="size-[18px] text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{integration.name}</span>
                  <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={!integration.href}
                  nativeButton={!integration.href}
                  render={integration.href ? <a href={integration.href} /> : undefined}
                >
                  {integration.href ? "Configure" : "Coming soon"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
