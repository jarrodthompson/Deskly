import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function GeneralSettingsPage() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "general" } });
  const values = (setting?.value as Record<string, string>) ?? { companyName: "Deskly", timezone: "UTC" };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">General Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Workspace-wide preferences.</p>
      </div>
      <SettingsForm
        settingKey="general"
        initialValues={values}
        fields={[
          { key: "companyName", label: "Company name", placeholder: "Acme Inc." },
          { key: "supportUrl", label: "Public support portal URL", placeholder: "https://support.yourcompany.com" },
          { key: "timezone", label: "Default timezone", placeholder: "UTC" },
          { key: "brandColor", label: "Brand color", placeholder: "#06B6D4" },
        ]}
      />
    </div>
  );
}
