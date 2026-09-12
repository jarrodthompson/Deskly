import { prisma } from "@/lib/prisma";
import { SubmitTicketForm } from "@/components/portal/submit-ticket-form";

export default async function PortalNewTicketPage() {
  const categories = await prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Submit a Ticket</h1>
        <p className="text-sm text-muted-foreground mt-0.5">We&apos;ll get back to you as soon as possible.</p>
      </div>
      <SubmitTicketForm categories={categories} />
    </div>
  );
}
