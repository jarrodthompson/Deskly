import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function EmailSettingsPage() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "email" } });
  const values = (setting?.value as Record<string, string>) ?? {};

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Email Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure how tickets are created from and sent to email.</p>
      </div>

      <Card className="shadow-none max-w-xl bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20">
        <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-300">
          No email provider is connected yet. Once an inbound email address and SMTP/API credentials are added here, incoming emails to your support address will automatically create tickets, and agent replies will be sent back to the customer&apos;s inbox.
        </CardContent>
      </Card>

      <SettingsForm
        settingKey="email"
        initialValues={values}
        fields={[
          { key: "supportEmail", label: "Support inbound address", placeholder: "support@yourcompany.com", helpText: "Emails sent here become new tickets." },
          { key: "fromName", label: "From name", placeholder: "Acme Support" },
          { key: "fromEmail", label: "From email", placeholder: "support@yourcompany.com" },
          { key: "replyTo", label: "Reply-to address", placeholder: "support@yourcompany.com" },
        ]}
      />
    </div>
  );
}
