"use client";
// core/features/knowledge-base/UploadDocument.tsx
// MÔ TẢ: Component upload tài liệu với drag-and-drop + progress

import React, { useCallback, useRef, useState } from "react";
import { IngestionProgress } from "../../knowledge/ingestion/ingestion-service";
import { ACCEPTED_FILE_TYPES, LIMITS } from "../../shared/constants";
import { formatBytes } from "../../shared/utils";

interface UploadDocumentProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  progress: IngestionProgress | null;
}

const STAGE_ICONS: Record<IngestionProgress["stage"], string> = {
  loading:   "📂",
  chunking:  "✂️",
  embedding: "🧮",
  saving:    "💾",
  done:      "✅",
  error:     "❌",
};

export function UploadDocument({ onUpload, isUploading, progress }: UploadDocumentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    if (file.size > LIMITS.MAX_FILE_SIZE_BYTES) {
      return `File quá lớn. Tối đa ${LIMITS.MAX_FILE_SIZE_MB}MB.`;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_FILE_TYPES.extensions.includes(ext as typeof ACCEPTED_FILE_TYPES.extensions[number])) {
      return `Định dạng không hỗ trợ. Chấp nhận: ${ACCEPTED_FILE_TYPES.label}`;
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    setFileError(null);
    const err = validate(file);
    if (err) { setFileError(err); return; }
    await onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none
          ${isDragging
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-alt)]"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES.extensions.join(",")}
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        <div className="text-3xl mb-2">📄</div>
        <p className="text-sm font-medium text-[var(--text)]">
          {isDragging ? "Thả file vào đây" : "Kéo thả hoặc click để chọn file"}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {ACCEPTED_FILE_TYPES.label} · Tối đa {LIMITS.MAX_FILE_SIZE_MB}MB
        </p>
      </div>

      {/* File error */}
      {fileError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          <span>⚠️</span>
          <span>{fileError}</span>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && progress && (
        <div className="px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{STAGE_ICONS[progress.stage]}</span>
            <span className="text-xs text-[var(--text)] font-medium">{progress.message}</span>
            {progress.stage !== "done" && progress.stage !== "error" && (
              <span className="ml-auto w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Progress bar */}
          {progress.stage !== "done" && progress.stage !== "error" && (
            <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                style={{
                  width: {
                    loading: "20%", chunking: "45%",
                    embedding: "75%", saving: "90%",
                    done: "100%", error: "100%",
                  }[progress.stage],
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}