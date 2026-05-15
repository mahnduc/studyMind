// AgentRuntimeContext.tsx
// Giải pháp: thêm hàm reloadFromStorage() để đồng bộ lại runtime
// mỗi khi API key trong storage thay đổi (thêm, sửa, xóa).

"use client";

import { keyService } from "@/app/dashboard/settings/api-key/_services/key.service";
import { bootstrapAgent } from "@/core/agent/capabilities/bootstrap";
import { AgentRuntime } from "@/core/agent/runtime/runtime";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface AgentRuntimeContextType {
  runtime: AgentRuntime | null;
  isLoading: boolean;
  error: "MISSING_KEY" | "INIT_ERROR" | string | null;

  // Gọi sau khi thêm key mới
  refreshKey: (newKey: string) => Promise<boolean>;

  // Gọi sau khi xóa key hoặc khi muốn đồng bộ lại từ storage
  reloadFromStorage: () => Promise<boolean>;

  // Xóa runtime ngay lập tức khỏi memory
  clearRuntime: () => void;
}

const AgentRuntimeContext = createContext<AgentRuntimeContextType | null>(null);

const RUNTIME_OPTIONS = {
  maxIterations: 10,
  streamingEnabled: true,
  humanInTheLoop: true,
  timeoutMs: 60_000,
};

export function AgentRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [runtime, setRuntime] = useState<AgentRuntime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Khởi tạo lại runtime dựa trên key hiện tại trong storage
   * hoặc key được truyền vào.
   */
  const initRuntime = useCallback(async (providedKey?: string) => {
    try {
      setIsLoading(true);

      const apiKey =
        providedKey ?? (await keyService.getRandomKey("groq"));

      // Không còn key trong storage -> xóa runtime khỏi memory ngay
      if (!apiKey) {
        setRuntime(null);
        setError("MISSING_KEY");
        return false;
      }

      // Luôn bootstrap lại để đảm bảo runtime dùng đúng key hiện tại
      const newRuntime = await bootstrapAgent({
        groqApiKey: apiKey,
        runtimeOptions: RUNTIME_OPTIONS,
      });

      setRuntime(newRuntime);
      setError(null);
      return true;
    } catch (err) {
      setRuntime(null);
      setError(err instanceof Error ? err.message : "INIT_ERROR");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Gọi sau khi người dùng vừa lưu API key mới.
   */
  const refreshKey = useCallback(
    async (newKey: string) => {
      if (!newKey?.trim()) return false;
      return await initRuntime(newKey.trim());
    },
    [initRuntime]
  );

  /**
   * Gọi sau khi xóa key khỏi storage.
   * Hàm này đọc lại storage; nếu không còn key thì runtime sẽ bị set null.
   */
  const reloadFromStorage = useCallback(async () => {
    return await initRuntime();
  }, [initRuntime]);

  /**
   * Xóa runtime ngay trong memory mà không cần đọc storage.
   */
  const clearRuntime = useCallback(() => {
    setRuntime(null);
    setError("MISSING_KEY");
  }, []);

  // Khởi tạo khi app load lần đầu
  useEffect(() => {
    initRuntime();
  }, [initRuntime]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#FF3399] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#2D3436]">
            Đang kiểm tra cấu hình hệ thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AgentRuntimeContext.Provider
      value={{
        runtime,
        isLoading,
        error,
        refreshKey,
        reloadFromStorage,
        clearRuntime,
      }}
    >
      {children}
    </AgentRuntimeContext.Provider>
  );
}

export function useAgentRuntime() {
  const context = useContext(AgentRuntimeContext);
  
  if (!context) {
    throw new Error(
      "useAgentRuntime must be used inside AgentRuntimeProvider"
    );
  }

  return context;
}