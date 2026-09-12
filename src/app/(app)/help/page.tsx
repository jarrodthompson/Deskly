import Link from "next/link";
import { BookOpen, Mail, Keyboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Help</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resources for using Deskly.</p>
      </div>

      <Link href="/knowledge-base">
        <Card className="shadow-none hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center shrink-0"><BookOpen className="size-[18px]" /></div>
            <div>
              <div className="font-medium text-sm">Knowledge Base</div>
              <div className="text-xs text-muted-foreground">Browse articles for common questions.</div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Keyboard className="size-4" /> Keyboard shortcuts</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Open search / quick create</span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl K</kbd></div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Mail className="size-4" /> Contact</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Reach your workspace administrator for account or access issues.
        </CardContent>
      </Card>
    </div>
  );
}
