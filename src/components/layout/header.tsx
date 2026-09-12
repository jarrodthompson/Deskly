"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, HelpCircle, Menu, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { StaffRole } from "@/lib/rbac";

export function Header({
  user,
  unreadCount,
}: {
  user: { name: string; email: string; image?: string | null; role: StaffRole };
  unreadCount: number;
}) {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 flex items-center gap-3 px-4 md:px-6">
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 p-0">
          <MobileNav role={user.role} />
        </SheetContent>
      </Sheet>

      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden sm:flex items-center gap-2 h-9 w-full max-w-sm rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search tickets, customers, companies…</span>
        <kbd className="hidden lg:inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>

      <Button variant="ghost" size="icon" className="sm:hidden ml-auto" onClick={() => setPaletteOpen(true)} aria-label="Search">
        <Search className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          className="hidden sm:inline-flex bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
          size="sm"
          onClick={() => router.push("/tickets/new")}
        >
          <Plus className="size-4" />
          Create Ticket
        </Button>
        <Button size="icon" className="sm:hidden bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => router.push("/tickets/new")} aria-label="Create ticket">
          <Plus className="size-4" />
        </Button>

        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/notifications" />} className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center rounded-full bg-cyan-600 p-0 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>

        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/help" />} aria-label="Help">
          <HelpCircle className="size-5" />
        </Button>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
