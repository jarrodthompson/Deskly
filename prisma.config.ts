import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Only the CLI reads this. Migrations need the session-mode connection, since
  // the transaction-mode pooler in DATABASE_URL cannot run DDL reliably; the
  // runtime client builds its own pooled adapter in src/lib/prisma.ts.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
