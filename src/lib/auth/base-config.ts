import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config (no providers/Prisma/bcrypt) so middleware can decode
 * the JWT without pulling Node-only dependencies into the Edge runtime bundle.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.kind = user.kind;
        token.role = user.role;
        token.teamId = user.teamId;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.kind = token.kind;
      session.user.role = token.role;
      session.user.teamId = token.teamId;
      session.user.companyId = token.companyId;
      return session;
    },
  },
};
