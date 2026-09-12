"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setDefaultSlaPolicy } from "@/lib/actions/sla";

export function SetDefaultButton({ policyId }: { policyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await setDefaultSlaPolicy(policyId);
            toast.success("Default policy updated.");
            router.refresh();
          } catch {
            toast.error("Could not update default policy.");
          }
        })
      }
    >
      {isPending && <Loader2 className="size-3.5 animate-spin" />}
      Set as default
    </Button>
  );
}
