"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCustomerStatus } from "@/lib/actions/customers";
import type { AccountStatus } from "@prisma/client";

export function AccountStatusToggle({ customerId, status }: { customerId: string; status: AccountStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      items={{ ACTIVE: "Active", INACTIVE: "Inactive" }}
      value={status}
      disabled={isPending}
      onValueChange={(v) =>
        startTransition(async () => {
          try {
            await updateCustomerStatus(customerId, v as AccountStatus);
            toast.success("Status updated.");
            router.refresh();
          } catch {
            toast.error("Could not update status.");
          }
        })
      }
    >
      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="INACTIVE">Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
}
