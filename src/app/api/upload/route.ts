import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth/config";
import { attachmentUrlForPath, createAttachmentSignedUploadUrl, isStorageConfigured } from "@/lib/storage";

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
// Also enforced by the bucket's file_size_limit, which is what stops a client lying here.
const MAX_SIZE = 15 * 1024 * 1024;

// Issues a signed upload URL so the browser sends the file straight to storage.
// Proxying the bytes through this function would hit Vercel's 4.5MB body limit.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "File storage is not configured on this server." }, { status: 503 });
  }

  const { fileName, fileType, fileSize } = (await req.json().catch(() => ({}))) as {
    fileName?: unknown;
    fileType?: unknown;
    fileSize?: unknown;
  };
  if (typeof fileName !== "string" || !fileName || typeof fileSize !== "number") {
    return NextResponse.json({ error: "Invalid file details" }, { status: 400 });
  }
  if (fileSize > MAX_SIZE) return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 400 });

  const contentType = typeof fileType === "string" && fileType ? fileType : "application/octet-stream";
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: `File type ${contentType} is not allowed` }, { status: 400 });
  }

  const rawExt = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  const ext = /^[a-z0-9]{1,12}$/.test(rawExt) ? `.${rawExt}` : "";
  const objectPath = `tickets/${randomUUID()}${ext}`;

  try {
    const uploadUrl = await createAttachmentSignedUploadUrl(objectPath);
    return NextResponse.json({ uploadUrl, fileUrl: attachmentUrlForPath(objectPath), fileType: contentType });
  } catch (error) {
    console.error("[upload] signing failed", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
