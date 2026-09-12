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

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    kind: "staff" | "customer";
    role?: StaffRole;
    teamId?: string | null;
    companyId?: string | null;
  }
}
