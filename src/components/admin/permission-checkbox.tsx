"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleRolePermission } from "@/lib/actions/admin";

export function PermissionCheckbox({ roleId, permissionId, checked, disabled }: { roleId: string; permissionId: string; checked: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Checkbox
      checked={checked}
      disabled={disabled || isPending}
      onCheckedChange={(next) =>
        startTransition(async () => {
          try {
            await toggleRolePermission(roleId, permissionId, !!next);
            router.refresh();
          } catch {
            toast.error("Could not update permission.");
          }
        })
      }
    />
  );
}
