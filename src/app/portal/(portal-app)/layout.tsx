import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, LifeBuoy, Ticket, LayoutDashboard, BookOpen } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils-format";
import { SignOutButton } from "@/components/portal/sign-out-button";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.kind !== "customer") redirect("/portal/sign-in");

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id }, select: { name: true } });

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur flex items-center gap-4 px-4 md:px-6">
        <Link href="/portal" className="flex items-center gap-2.5 shrink-0">
          <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold tracking-tight hidden sm:inline">Deskly Support</span>
        </Link>

        <nav className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/portal" />}><LayoutDashboard className="size-4" /> Dashboard</Button>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/portal/tickets" />}><Ticket className="size-4" /> My Tickets</Button>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/portal/knowledge-base" />}><BookOpen className="size-4" /> Help Center</Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" size="sm" nativeButton={false} render={<Link href="/portal/tickets/new" />}>
            <LifeBuoy className="size-4" /> Submit Ticket
          </Button>
          <Avatar className="size-8"><AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(customer?.name ?? session.user.name)}</AvatarFallback></Avatar>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
