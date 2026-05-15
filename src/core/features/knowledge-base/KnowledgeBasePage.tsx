"use client";
// core/features/knowledge-base/KnowledgeBasePage.tsx
// MÔ TẢ: Trang quản lý tài liệu - upload, list, delete

import React, { useState } from "react";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import { UploadDocument } from "./UploadDocument";
import { KnowledgeDocument } from "../../knowledge/types";
import { formatBytes, formatRelativeTime } from "../../shared/utils";

// ── Document card ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  KnowledgeDocument["status"],
  { label: string; color: string; icon: string }
> = {
  pending:  { label: "Đang chờ",    color: "text-yellow-500", icon: "⏳" },
  indexing: { label: "Đang index",  color: "text-blue-500",   icon: "⚙️" },
  ready:    { label: "Sẵn sàng",    color: "text-green-500",  icon: "✅" },
  error:    { label: "Lỗi",         color: "text-red-500",    icon: "❌" },
};

const TYPE_ICONS: Record<KnowledgeDocument["type"], string> = {
  pdf:      "📕",
  markdown: "📝",
  txt:      "📄",
};

function DocumentCard({
  doc,
  onDelete,
}: {
  doc: KnowledgeDocument;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const status = STATUS_CONFIG[doc.status];

  return (
    <div className="flex items-start gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)]/30 transition-colors">
      <span className="text-2xl shrink-0 mt-0.5">{TYPE_ICONS[doc.type]}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)] truncate">{doc.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs font-medium ${status.color}`}>
            {status.icon} {status.label}
          </span>
          {doc.status === "ready" && (
            <>
              <span className="text-[var(--border)]">·</span>
              <span className="text-xs text-[var(--text-muted)]">{doc.chunkCount} đoạn</span>
            </>
          )}
          <span className="text-[var(--border)]">·</span>
          <span className="text-xs text-[var(--text-muted)]">{formatBytes(doc.sizeBytes)}</span>
          <span className="text-[var(--border)]">·</span>
          <span className="text-xs text-[var(--text-muted)]">{formatRelativeTime(doc.uploadedAt)}</span>
        </div>
        {doc.status === "error" && doc.errorMessage && (
          <p className="text-xs text-red-500 mt-1 truncate">{doc.errorMessage}</p>
        )}
      </div>

      {/* Delete */}
      <div className="shrink-0">
        {confirming ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-alt)]"
            >
              Huỷ
            </button>
            <button
              onClick={() => { onDelete(doc.id); setConfirming(false); }}
              className="px-2 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Xoá
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Xoá tài liệu"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── KnowledgeBasePage ─────────────────────────────────────────

export function KnowledgeBasePage() {
  const {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    upload,
    deleteDocument,
  } = useKnowledgeBase();

  const readyCount = documents.filter((d) => d.status === "ready").length;

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--text)]">Cơ sở tri thức</p>
        <p className="text-xs text-[var(--text-muted)]">
          {isLoading ? "Đang tải..." : `${readyCount} / ${documents.length} tài liệu đã sẵn sàng`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Upload zone */}
        <UploadDocument
          onUpload={upload}
          isUploading={isUploading}
          progress={uploadProgress}
        />

        {/* Error */}
        {error && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Document list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--surface-alt)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)]">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm font-medium">Chưa có tài liệu nào</p>
            <p className="text-xs mt-1">Upload tài liệu để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--text-muted)] px-1">
              Tài liệu ({documents.length})
            </p>
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={deleteDocument}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}