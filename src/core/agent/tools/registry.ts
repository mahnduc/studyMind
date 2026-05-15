// FILE: core/agent/tools/registry.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: ToolRegistry - quản lý đăng ký tools theo cơ chế "Plug and Play".
//        Cung cấp chuyển đổi sang schema tương thích OpenAI function calling.
//        Không biết về bất kỳ tool cụ thể nào.

import { LLMToolSchema, ToolDefinition } from "./types";



export class ToolRegistry {
  private readonly store: Map<string, ToolDefinition> = new Map();

  /**
   * Đăng ký một tool.
   * Gọi trong bootstrap.ts - không gọi trực tiếp từ executor.
   */
  register(tool: ToolDefinition): void {
    if (this.store.has(tool.id)) {
      console.warn(
        `[ToolRegistry] Overwriting existing tool: "${tool.id}"`
      );
    }
    this.store.set(tool.id, tool);
  }

  /**
   * Đăng ký nhiều tools cùng lúc.
   */
  registerMany(tools: ToolDefinition[]): void {
    tools.forEach((t) => this.register(t));
  }

  /**
   * Tra cứu tool theo ID.
   */
  get(id: string): ToolDefinition | undefined {
    return this.store.get(id);
  }

  /**
   * Lấy danh sách tools theo IDs cho phép - dùng bởi executor
   * để truyền cho LLM chỉ những tools phù hợp với capability.
   */
  getMany(ids: string[]): ToolDefinition[] {
    return ids
      .map((id) => this.store.get(id))
      .filter((t): t is ToolDefinition => t !== undefined);
  }

  /**
   * Chuyển đổi ToolDefinition sang LLM schema (OpenAI-compatible).
   */
  toLLMSchemas(ids: string[]): LLMToolSchema[] {
    return this.getMany(ids).map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.id,
        description: tool.description,
        parameters: {
          type: "object" as const,
          properties: Object.fromEntries(
            Object.entries(tool.parameters).map(([key, param]) => [
              key,
              {
                type: param.type,
                description: param.description,
                ...(param.enum ? { enum: param.enum } : {}),
              },
            ])
          ),
          required: tool.requiredParameters,
        },
      },
    }));
  }

  /**
   * Thực thi tool theo ID với input đã được LLM cung cấp.
   */
  async execute(
    toolId: string,
    input: Record<string, unknown>
  ): Promise<ReturnType<ToolDefinition["execute"]>> {
    const tool = this.store.get(toolId);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: "${toolId}"`,
      };
    }

    try {
      return await tool.execute(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Tool "${toolId}" threw an unexpected error: ${message}`,
      };
    }
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  unregister(id: string): boolean {
    return this.store.delete(id);
  }

  listAll(): ToolDefinition[] {
    return Array.from(this.store.values());
  }

  listIds(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }
}

// Singleton
export const toolRegistry = new ToolRegistry();
