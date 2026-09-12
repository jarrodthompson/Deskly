import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UserRowControls } from "@/components/admin/user-row-controls";
import { initials } from "@/lib/utils-format";
import type { StaffRole } from "@/lib/rbac";

export default async function AdminUsersPage() {
  const [users, teams] = await Promise.all([
    prisma.user.findMany({ include: { team: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} staff accounts</p>
        </div>
        <CreateUserDialog teams={teams} />
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Team</th>
                <th className="px-4 py-2.5 text-left font-medium">Role / Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage src={u.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{u.team?.name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <UserRowControls userId={u.id} role={u.roleKey as StaffRole} isActive={u.isActive} />
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
