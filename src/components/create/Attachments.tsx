"use client";

import { FileImage, FileSpreadsheet, FileText, Presentation, TriangleAlert, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { MAX_FILES, type Material } from "@/lib/material";
import { readMaterialFile } from "@/lib/read-file";

interface Attached {
  id: number;
  name: string;
  status: "reading" | "ready" | "error";
  text?: string;
  error?: string;
}

let nextId = 0;

/** Files attached to the prompt, read in the browser as they're added. */
export function useAttachments() {
  const [files, setFiles] = useState<Attached[]>([]);

  const add = useCallback(
    (list: FileList | File[]) => {
      const incoming = [...list];
      const room = Math.max(MAX_FILES - files.filter((f) => f.status !== "error").length, 0);
      const accepted = incoming.slice(0, room).map((file) => ({ file, entry: { id: nextId++, name: file.name, status: "reading" as const } }));
      const rejected = incoming.slice(room).map((file) => ({
        id: nextId++,
        name: file.name,
        status: "error" as const,
        error: `Up to ${MAX_FILES} files per deck.`,
      }));
      setFiles((all) => [...all, ...accepted.map((a) => a.entry), ...rejected]);
      const settle = (id: number, patch: Partial<Attached>) => setFiles((all) => all.map((f) => (f.id === id ? { ...f, ...patch } : f)));
      for (const { file, entry } of accepted) {
        readMaterialFile(file).then(
          (text) => settle(entry.id, { status: "ready", text }),
          (error: unknown) =>
            settle(entry.id, { status: "error", error: error instanceof Error ? error.message : "This file couldn't be read." }),
        );
      }
    },
    [files],
  );

  const remove = useCallback((id: number) => setFiles((all) => all.filter((f) => f.id !== id)), []);

  const material = useMemo<Material[]>(
    () => files.filter((f) => f.status === "ready" && f.text).map((f) => ({ name: f.name, text: f.text! })),
    [files],
  );

  return { files, add, remove, material, reading: files.some((f) => f.status === "reading") };
}

function iconFor(name: string) {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif", "heic", "heif"].includes(ext)) return FileImage;
  if (["xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (ext === "pptx") return Presentation;
  return FileText;
}

/** The attached files as chips: reading, ready (with how much was read) or failed. */
export function AttachmentChips({ files, onRemove }: { files: Attached[]; onRemove: (id: number) => void }) {
  if (files.length === 0) return null;
  return (
    <ul className="attachments" aria-label="Attached files">
      {files.map((f) => {
        const Icon = f.status === "error" ? TriangleAlert : iconFor(f.name);
        const words = f.text ? f.text.split(/\s+/).length : 0;
        return (
          <li key={f.id} className={`attachment is-${f.status}`}>
            <span className="attachment__icon" aria-hidden="true">
              <Icon size={16} />
            </span>
            <span className="attachment__body">
              <span className="attachment__name" title={f.name}>{f.name}</span>
              <span className="attachment__meta" role={f.status === "error" ? "alert" : undefined}>
                {f.status === "reading" ? "Reading…" : f.status === "ready" ? `${words.toLocaleString("en-US")} words read` : f.error}
              </span>
            </span>
            {f.status === "reading" && <span className="attachment__scan" aria-hidden="true" />}
            <button type="button" className="attachment__remove" aria-label={`Remove ${f.name}`} onClick={() => onRemove(f.id)}>
              <X size={14} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
