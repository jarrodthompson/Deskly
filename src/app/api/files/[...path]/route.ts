import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { attachmentUrlForPath, createAttachmentSignedUrl } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = await params;
  const objectPath = path.join("/");

  const attachment = await prisma.ticketAttachment.findFirst({
    where: { fileUrl: attachmentUrlForPath(objectPath) },
    select: { noteId: true, ticket: { select: { customerId: true } } },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.kind === "customer") {
    const isOwnTicket = attachment.ticket.customerId === session.user.id;
    if (!isOwnTicket || attachment.noteId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    return NextResponse.redirect(await createAttachmentSignedUrl(objectPath));
  } catch (error) {
    console.error("[files] signed url failed", error);
    return NextResponse.json({ error: "Could not generate a download link." }, { status: 502 });
  }
}
