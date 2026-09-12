import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.kind !== "staff") {
    return NextResponse.json({ tickets: [], customers: [], companies: [] }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ tickets: [], customers: [], companies: [] });
  }

  const numericId = Number(q.replace(/^TKT-/i, ""));

  const [tickets, customers, companies] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          ...(Number.isFinite(numericId) && !Number.isNaN(numericId) ? [{ number: numericId }] : []),
        ],
      },
      select: { id: true, number: true, subject: true, status: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 5,
    }),
    prisma.company.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ tickets, customers, companies });
}
