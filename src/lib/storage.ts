import { createClient } from "@supabase/supabase-js";

export const ATTACHMENT_BUCKET = "ticket-attachments";

export function isStorageConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function storageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("File storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export async function createAttachmentSignedUploadUrl(objectPath: string) {
  const { data, error } = await storageClient()
    .storage.from(ATTACHMENT_BUCKET)
    .createSignedUploadUrl(objectPath);
  if (error || !data) throw new Error(error?.message ?? "Could not create an upload link.");
  return data.signedUrl;
}

export async function createAttachmentSignedUrl(objectPath: string, expiresInSeconds = 60) {
  const { data, error } = await storageClient()
    .storage.from(ATTACHMENT_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds);
  if (error || !data) throw new Error(error?.message ?? "Could not create a download link.");
  return data.signedUrl;
}

export function attachmentUrlForPath(objectPath: string) {
  return `/api/files/${objectPath}`;
}

export function objectPathFromAttachmentUrl(fileUrl: string) {
  return fileUrl.startsWith("/api/files/") ? fileUrl.slice("/api/files/".length) : null;
}
