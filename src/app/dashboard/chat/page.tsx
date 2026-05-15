"use client";

import React, { useState } from "react";
import { useAgentRuntime } from "@/context/AgentRuntimeContext";

import { ChatPage } from "@/core/features/chat/ChatPage";
import { DEFAULT_SESSION_ID } from "@/core/shared/constants";

import { keyApi } from "../settings/api-key/_api/key.api";

function MissingKeyView({
  onKeySaved,
}: {
  onKeySaved: (newKey: string) => Promise<void> | void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError("Vui lòng nhập API Key.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1. Lưu key xuống storage thông qua API:
      // keyApi.addKey -> keyService.add(provider, key)
      await keyApi.addKey("groq", trimmedKey);

      // 2. Thông báo cho AgentRuntime reload lại key và khởi tạo runtime
      await onKeySaved(trimmedKey);

      // 3. Xóa nội dung input sau khi lưu thành công
      setApiKey("");
    } catch (err) {
      console.error("Save API key failed:", err);
      setError("Không thể lưu API Key. Vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-[#F0F0F0] rounded-3xl p-8 shadow-sm">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="text-6xl">🤖</div>

            <h1 className="text-2xl font-bold text-[#2D3436]">
              Chat chưa sẵn sàng
            </h1>

            <p className="text-sm text-[#636E72] leading-relaxed">
              Vui lòng nhập{" "}
              <span className="font-semibold">Groq API Key</span> để kích hoạt
              trợ lý AI.
            </p>

            <p className="text-sm text-[#B2BEC3]">
              Lấy API Key tại{" "}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF3399] font-semibold hover:underline"
              >
                console.groq.com
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving) {
                    handleSave();
                  }
                }}
                placeholder="gsk_..."
                className="flex-1 px-4 py-3 bg-[#F7F9FB] border border-[#DDE3E8] rounded-xl outline-none focus:border-[#FF3399] font-mono text-sm"
              />

              <button
                onClick={handleSave}
                disabled={!apiKey.trim() || saving}
                className="px-6 py-3 rounded-xl bg-[#FF3399] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Đang lưu..." : "Lưu API Key"}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatAppPage() {
  const { runtime, error, refreshKey } = useAgentRuntime();

  // Chỉ hiển thị form nhập API Key khi thực sự thiếu key
  if (error === "MISSING_KEY" || !runtime) {
    return (
      <MissingKeyView
        onKeySaved={async (newKey) => {
          // refreshKey sẽ đọc lại key vừa lưu và khởi tạo runtime
          await refreshKey(newKey);
        }}
      />
    );
  }

  // Khi đã có runtime hợp lệ, toàn bộ UI do ChatPage đảm nhiệm
  return (
    <ChatPage
      runtime={runtime}
      sessionId={DEFAULT_SESSION_ID}
    />
  );
}