// FILE: core/agent/tools/types.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Interface cho Tool Definition và Tool Result.
//        Không import bất kỳ tool cụ thể nào.

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter; // nếu type là array
  properties?: Record<string, ToolParameter>; // nếu type là object
}

export interface ToolDefinition {
  /** ID duy nhất của tool */
  id: string;

  /** Tên hiển thị cho LLM */
  name: string;

  /** Mô tả chức năng - LLM đọc để quyết định gọi tool */
  description: string;

  /** Schema của input parameters */
  parameters: Record<string, ToolParameter>;

  /** Các parameter bắt buộc */
  requiredParameters: string[];

  /**
   * Hàm thực thi tool - nhận input đã validate, trả về kết quả.
   * Không throw - thay vào đó trả về ToolResult với success: false.
   */
  execute(input: Record<string, unknown>): Promise<ToolResult>;

  /** Tool này có thể gây tác dụng phụ không (ghi dữ liệu, gọi API ngoài...) */
  hasSideEffects?: boolean;

  /** Metadata mở rộng */
  meta?: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  /** Metadata để reasoning loop quyết định bước tiếp theo */
  metadata?: Record<string, unknown>;
}

/** Định dạng tool call để gửi tới LLM (OpenAI-compatible) */
export interface LLMToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}
