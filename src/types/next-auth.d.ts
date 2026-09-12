import type { StaffRole } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      kind: "staff" | "customer";
      role?: StaffRole;
      teamId?: string | null;
      companyId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    kind: "staff" | "customer";
    role?: StaffRole;
    teamId?: string | null;
    companyId?: string | null;
  }
}

// `next-auth/jwt` only re-exports from `@auth/core/jwt`, so the JWT interface
// has to be augmented at its source for declaration merging to apply.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    kind: "staff" | "customer";
    role?: StaffRole;
    teamId?: string | null;
    companyId?: string | null;
  }
}
