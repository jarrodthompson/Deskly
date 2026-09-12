"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Users, Building2, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ticketNumberLabel } from "@/lib/ticket-meta";

type SearchResults = {
  tickets: { id: string; number: number; subject: string; status: string }[];
  customers: { id: string; name: string; email: string }[];
  companies: { id: string; name: string }[];
};

const EMPTY: SearchResults = { tickets: [], customers: [], companies: [] };

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(EMPTY);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        // ignored: aborted or transient network error
      }
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function go(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  const hasResults = results.tickets.length + results.customers.length + results.companies.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search tickets, customers and companies">
      <CommandInput placeholder="Search tickets, customers, companies…" value={query} onValueChange={setQuery} />
      <CommandList>
        {query.trim().length < 2 ? (
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => go("/tickets/new")}>
              <Plus /> Create new ticket
            </CommandItem>
            <CommandItem onSelect={() => go("/tickets")}>
              <Ticket /> Go to ticket inbox
            </CommandItem>
          </CommandGroup>
        ) : !hasResults ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {results.tickets.length > 0 && (
              <CommandGroup heading="Tickets">
                {results.tickets.map((t) => (
                  <CommandItem key={t.id} onSelect={() => go(`/tickets/${t.id}`)}>
                    <Ticket />
                    <span className="font-mono text-xs text-muted-foreground">{ticketNumberLabel(t.number)}</span>
                    <span className="truncate">{t.subject}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.customers.length > 0 && (
              <CommandGroup heading="Customers">
                {results.customers.map((c) => (
                  <CommandItem key={c.id} onSelect={() => go(`/customers/${c.id}`)}>
                    <Users />
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.companies.length > 0 && (
              <CommandGroup heading="Companies">
                {results.companies.map((c) => (
                  <CommandItem key={c.id} onSelect={() => go(`/companies/${c.id}`)}>
                    <Building2 />
                    <span>{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
