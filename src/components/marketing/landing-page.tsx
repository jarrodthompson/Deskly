import Link from "next/link";
import {
  Ticket,
  Timer,
  Zap,
  BarChart3,
  BookOpen,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { ProductPreview } from "@/components/marketing/product-preview";

const FEATURES = [
  { icon: Ticket, title: "Unified Ticket Inbox", description: "Filter, sort and bulk-manage every conversation from one inbox, with saved views and live SLA countdowns." },
  { icon: Timer, title: "SLA Management", description: "Configurable first-response and resolution targets per priority, with automatic breach tracking." },
  { icon: Zap, title: "Automation Engine", description: "Route, tag, assign and escalate tickets automatically the moment they're created." },
  { icon: BarChart3, title: "Reporting & Analytics", description: "Track volume, response times, SLA compliance and CSAT across your whole team in real time." },
  { icon: BookOpen, title: "Knowledge Base", description: "Publish self-serve articles customers can search before they ever open a ticket." },
  { icon: Users, title: "Customer Portal", description: "Give customers a clean, branded place to submit, track and reply to their own tickets." },
];

const AUDIENCE = ["IT support companies", "MSPs", "Internal IT departments", "Customer support teams", "Technical support teams", "SaaS support teams"];

const WORKFLOW = [
  { step: "01", title: "Capture", description: "Tickets come in from the customer portal, email, or your agents — each one automatically gets a number, SLA clock and category." },
  { step: "02", title: "Route", description: "Automations assign the right team and agent based on category, priority or company plan, no manual triage required." },
  { step: "03", title: "Resolve", description: "Agents reply, leave internal notes, and track everything on one activity timeline until the ticket is closed." },
  { step: "04", title: "Improve", description: "Reports and CSAT scores show you where response times slip and which categories need attention." },
];

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-svh bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(6,182,212,0.14),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(6,182,212,0.10),transparent_40%)]" />
        <div className="mx-auto max-w-6xl px-4 md:px-6 pt-16 md:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
              Modern helpdesk platform
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Support tickets,<br /> finally under control.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Deskly brings ticketing, SLAs, automations, and reporting into one clean workspace &mdash; built for IT teams, MSPs, and support desks who are done juggling spreadsheets and shared inboxes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/sign-in" />}>
                Sign in to workspace <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/portal/sign-in" />}>
                View customer portal
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Demo credentials are available right on the sign-in screen &mdash; no signup required.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="features" className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Everything a support team actually needs</h2>
            <p className="mt-2 text-muted-foreground">No bloat, no hundred-tab settings menu &mdash; just the tools your agents will actually use every day.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5">
                <div className="size-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-t">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">From new ticket to resolved, without the busywork</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW.map((w) => (
              <div key={w.step}>
                <div className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{w.step}</div>
                <h3 className="mt-2 font-medium">{w.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="audience" className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Built for teams who live in their inbox</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {AUDIENCE.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm">
                <CheckCircle2 className="size-3.5 text-cyan-600" /> {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Ready to bring order to your support queue?</h2>
          <p className="mt-2 text-muted-foreground">Sign in with a demo account and see the full workspace in minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white" nativeButton={false} render={<Link href="/sign-in" />}>
              Sign in to workspace <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span>Deskly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Staff sign in</Link>
            <Link href="/portal/sign-in" className="hover:text-foreground transition-colors">Customer portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
