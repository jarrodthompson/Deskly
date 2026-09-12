"use client";

import { signOut } from "next-auth/react";
import { ChevronsUpDown, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_META, type StaffRole } from "@/lib/rbac";
import { initials } from "@/lib/utils-format";

export function UserMenu({
  user,
  collapsed,
}: {
  user: { name: string; email: string; image?: string | null; role: StaffRole };
  collapsed: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent transition-colors",
          collapsed && "justify-center px-0"
        )}
      >
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="bg-cyan-600 text-white text-xs">{initials(user.name)}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-sidebar-foreground/50 truncate">{ROLE_META[user.role].name}</div>
            </div>
            <ChevronsUpDown className="size-3.5 text-sidebar-foreground/40 shrink-0" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs font-normal text-muted-foreground truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<a href="/admin/settings" />}>
          <UserIcon className="size-4" />
          Profile settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
