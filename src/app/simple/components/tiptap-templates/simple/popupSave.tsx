"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

type SaveFileModalProps = {
  open: boolean
  fileName: string
  setFileName: (value: string) => void
  onClose: () => void
  onSave: () => void
}

export default function SaveFileModal({
  open,
  fileName,
  setFileName,
  onClose,
  onSave,
}: SaveFileModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }

      if (e.key === "Enter") {
        onSave()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [onClose, onSave])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-105 rounded-2xl border shadow-2xl p-6"
        style={{
          backgroundColor: "var(--tt-bg-color)",
          borderColor: "var(--tt-scrollbar-color)",
          color: "var(--tt-theme-text)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            Save Markdown File
          </h2>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm opacity-70">
            File name
          </label>

          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="my-document"
            className="w-full rounded-xl border px-4 py-3 outline-none bg-transparent"
            style={{
              borderColor: "var(--tt-scrollbar-color)",
            }}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border transition"
            style={{
              borderColor: "var(--tt-scrollbar-color)",
            }}
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-black text-white transition hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}