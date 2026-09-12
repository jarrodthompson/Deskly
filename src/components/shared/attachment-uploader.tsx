"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileSizeLabel } from "@/lib/utils-format";

export type UploadedFile = { fileName: string; fileUrl: string; fileType: string; fileSize: number };

export function AttachmentUploader({
  files,
  onChange,
  compact = false,
}: {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? `Failed to upload ${file.name}`);
          continue;
        }
        uploaded.push(data);
      }
      onChange([...files, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    onChange(files.filter((f) => f.fileUrl !== url));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.log,.zip,.json"
      />
      <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {uploading ? "Uploading…" : "Attach files"}
      </Button>
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.fileUrl} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-sm">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{f.fileName}</span>
              <span className="text-xs text-muted-foreground shrink-0">{fileSizeLabel(f.fileSize)}</span>
              <button type="button" onClick={() => remove(f.fileUrl)} className="text-muted-foreground hover:text-destructive shrink-0">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
