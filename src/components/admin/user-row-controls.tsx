"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { setUserRole, setUserActive } from "@/lib/actions/admin";
import { ROLE_META, STAFF_ROLES, type StaffRole } from "@/lib/rbac";

export function UserRowControls({ userId, role, isActive }: { userId: string; role: StaffRole; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        items={Object.fromEntries(STAFF_ROLES.map((r) => [r, ROLE_META[r].name]))}
        value={role}
        disabled={isPending}
        onValueChange={(v) =>
          startTransition(async () => {
            try {
              await setUserRole(userId, v as StaffRole);
              toast.success("Role updated.");
              router.refresh();
            } catch {
              toast.error("Could not update role.");
            }
          })
        }
      >
        <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_META[r].name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Switch
        checked={isActive}
        disabled={isPending}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            try {
              await setUserActive(userId, checked);
              router.refresh();
            } catch {
              toast.error("Could not update status.");
            }
          })
        }
      />
    </div>
  );
}
