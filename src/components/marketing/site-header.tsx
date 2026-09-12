"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Deskly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#workflow" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#audience" className="hover:text-foreground transition-colors">Who it&apos;s for</a>
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/portal/sign-in" />}>
            Customer portal
          </Button>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </div>

        <button
          className="ml-auto md:hidden text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-3 bg-background">
          <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
            <a href="#features" onClick={() => setOpen(false)} className="hover:text-foreground">Features</a>
            <a href="#workflow" onClick={() => setOpen(false)} className="hover:text-foreground">How it works</a>
            <a href="#audience" onClick={() => setOpen(false)} className="hover:text-foreground">Who it&apos;s for</a>
          </nav>
          <div className="flex flex-col gap-2 pt-1">
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/portal/sign-in" />}>
              Customer portal
            </Button>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/sign-in" />}>
              Sign in
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
