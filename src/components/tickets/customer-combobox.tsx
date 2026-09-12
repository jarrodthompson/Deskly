"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

export type CustomerOption = { id: string; name: string; email: string; companyName: string | null };

export function CustomerCombobox({
  customers,
  value,
  onChange,
  onCreateNew,
}: {
  customers: CustomerOption[];
  value: string | null;
  onChange: (customerId: string) => void;
  onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" className="w-full justify-between font-normal">
            {selected ? (
              <span className="truncate">{selected.name} <span className="text-muted-foreground">· {selected.email}</span></span>
            ) : (
              <span className="text-muted-foreground">Select a customer…</span>
            )}
            <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search customers…" />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.email}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value === c.id ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0">
                    <div className="truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.email}{c.companyName ? ` · ${c.companyName}` : ""}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => { setOpen(false); onCreateNew(); }}>
                <UserPlus className="size-4" /> Add new customer
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
