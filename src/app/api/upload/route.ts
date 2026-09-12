import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth/config";
import { attachmentUrlForPath, isStorageConfigured, uploadAttachment } from "@/lib/storage";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/json",
  "application/octet-stream",
];
const MAX_SIZE = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "File storage is not configured on this server." }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 400 });
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} is not allowed` }, { status: 400 });
  }

  const rawExt = path.extname(file.name).slice(1).toLowerCase();
  const ext = /^[a-z0-9]{1,12}$/.test(rawExt) ? `.${rawExt}` : "";
  const objectPath = `tickets/${randomUUID()}${ext}`;
  const contentType = file.type || "application/octet-stream";

  try {
    await uploadAttachment(objectPath, Buffer.from(await file.arrayBuffer()), contentType);
  } catch (error) {
    console.error("[upload] failed", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    fileName: file.name,
    fileUrl: attachmentUrlForPath(objectPath),
    fileType: contentType,
    fileSize: file.size,
  });
}
