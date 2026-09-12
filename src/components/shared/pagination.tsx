import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  buildHref,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  buildHref: (page: number) => string;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}-{end}</span> of <span className="font-medium text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="size-4" />
        </PageLink>
        <span className="px-2 text-muted-foreground">Page {page} of {pageCount}</span>
        <PageLink href={buildHref(page + 1)} disabled={page >= pageCount}>
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40">{children}</span>;
  }
  return (
    <Link href={href} className={cn("flex size-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors")}>
      {children}
    </Link>
  );
}
