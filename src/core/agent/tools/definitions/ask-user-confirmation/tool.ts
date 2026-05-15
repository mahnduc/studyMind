// core/agent/tools/definitions/ask-user-confirmation/tool.ts
// MÔ TẢ: Tool yêu cầu người dùng xác nhận trước khi thực hiện hành động
//        Dùng trong workflow khi cần human-in-the-loop

import { ToolDefinition } from "../../types";

// Callback được inject từ bên ngoài (UI layer)
// UI sẽ gán hàm này khi mount ApprovalDialog
let _confirmationHandler: ((message: string) => Promise<boolean>) | null = null;

export function setConfirmationHandler(
  handler: (message: string) => Promise<boolean>
): void {
  _confirmationHandler = handler;
}

export const askUserConfirmationTool: ToolDefinition = {
  id: "ask-user-confirmation",
  name: "ask_user_confirmation",
  description:
    "Hỏi người dùng xác nhận trước khi thực hiện một hành động quan trọng. " +
    "Trả về true nếu người dùng đồng ý, false nếu từ chối.",
  parameters: {
    message: {
      type: "string",
      description: "Nội dung câu hỏi xác nhận hiển thị cho người dùng",
      required: true,
    },
    actionDescription: {
      type: "string",
      description: "Mô tả hành động sắp thực hiện (hiển thị chi tiết hơn)",
    },
  },
  requiredParameters: ["message"],
  hasSideEffects: true,

  async execute(input) {
    const message = input.message as string;

    if (!_confirmationHandler) {
      // Fallback: tự động approve nếu không có UI handler
      console.warn(
        "[ask-user-confirmation] Không có confirmation handler - tự động approve"
      );
      return {
        success: true,
        output: { confirmed: true, method: "auto-approved" },
      };
    }

    try {
      const confirmed = await _confirmationHandler(message);
      return {
        success: true,
        output: {
          confirmed,
          message,
          respondedAt: Date.now(),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `ask-user-confirmation thất bại: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};