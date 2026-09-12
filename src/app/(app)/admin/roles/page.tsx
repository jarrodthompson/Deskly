import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PermissionCheckbox } from "@/components/admin/permission-checkbox";
import { PERMISSIONS } from "@/lib/rbac";

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.permission.findMany({ orderBy: { category: "asc" } }),
  ]);

  const categories = [...new Set(PERMISSIONS.map((p) => p.category))];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Super Admins have every permission by design and aren&apos;t shown here to prevent lockout.</p>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium sticky left-0 bg-muted/40">Permission</th>
                {roles.filter((r) => r.key !== "SUPER_ADMIN").map((r) => (
                  <th key={r.id} className="px-4 py-2.5 text-center font-medium whitespace-nowrap">
                    {r.name}
                    <div className="text-[10px] font-normal text-muted-foreground">{r._count.users} users</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <Fragment key={category}>
                  <tr className="bg-muted/20">
                    <td colSpan={roles.length} className="px-4 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/20">{category}</td>
                  </tr>
                  {permissions.filter((p) => p.category === category).map((perm) => (
                    <tr key={perm.id} className="border-b last:border-0">
                      <td className="px-4 py-2 sticky left-0 bg-card">
                        <div className="text-sm">{perm.key.split(".").slice(1).join(" ").replace(/_/g, " ") || perm.key}</div>
                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                      </td>
                      {roles.filter((r) => r.key !== "SUPER_ADMIN").map((role) => (
                        <td key={role.id} className="px-4 py-2 text-center">
                          <PermissionCheckbox
                            roleId={role.id}
                            permissionId={perm.id}
                            checked={role.permissions.some((rp) => rp.permissionId === perm.id)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <Badge key={r.id} variant="outline">{r.name}: {r._count.users} user{r._count.users === 1 ? "" : "s"}</Badge>
        ))}
      </div>
    </div>
  );
}
