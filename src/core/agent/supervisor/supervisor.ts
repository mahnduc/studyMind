// FILE: core/agent/supervisor/supervisor.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Supervisor - nhận danh sách capabilities từ registry,
//        phân loại intent, chọn capability và execution mode.
//        Không hard-code bất kỳ capability hay intent cụ thể nào.

import { ExecutionMode } from "../runtime/types";
import { CapabilityDefinition } from "../capabilities/types";
import { LLMProvider, LLMMessage } from "../providers/provider.interface";

export interface SupervisionResult {
  capabilityId: string;
  mode: ExecutionMode;
  confidence: number; // 0-1
  requiresApproval: boolean;
  approvalReason?: string;
  reasoning?: string; // debug
}

export interface SupervisorOptions {
  systemPrompt: string;
  model?: string;
  temperature?: number;
}

export class Supervisor {
  private readonly provider: LLMProvider;
  private readonly options: SupervisorOptions;

  constructor(provider: LLMProvider, options: SupervisorOptions) {
    this.provider = provider;
    this.options = options;
  }

  /**
   * Phân loại intent của người dùng và chọn capability phù hợp nhất.
   *
   * @param userInput - Input hiện tại của người dùng
   * @param history - Lịch sử hội thoại (role/content pairs)
   * @param availableCapabilities - Danh sách từ CapabilityRegistry
   */
  async supervise(
    userInput: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    availableCapabilities: CapabilityDefinition[]
  ): Promise<SupervisionResult> {
    if (availableCapabilities.length === 0) {
      throw new Error("[Supervisor] No capabilities registered");
    }

    // Xây dựng prompt mô tả các capability cho LLM
    const capabilitiesSchema = this._buildCapabilitiesSchema(availableCapabilities);

    const messages: LLMMessage[] = [
      {
        role: "system",
        content: this._buildSystemPrompt(capabilitiesSchema),
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      {
        role: "user",
        content: `User input: "${userInput}"\n\nRespond ONLY with valid JSON.`,
      },
    ];

    const response = await this.provider.complete(messages, {
      model: this.options.model,
      temperature: this.options.temperature ?? 0.1,
      maxTokens: 512,
    });

    return this._parseResponse(
      response.content ?? "",
      availableCapabilities[0].id
    );
  }

  // ── Private helpers ───────────────────────────────────────
  private _buildCapabilitiesSchema(capabilities: CapabilityDefinition[]): string {
    return capabilities
      .map(
        (c) =>
          `- id: "${c.id}" | name: "${c.name}" | defaultMode: "${c.defaultMode}"\n  description: ${c.description}\n  examples: ${c.triggerExamples.slice(0, 2).join("; ")}`
      )
      .join("\n\n");
  }

  private _buildSystemPrompt(capabilitiesSchema: string): string {
    return `${this.options.systemPrompt}

You are an intent classifier. Given user input and conversation history, select the most appropriate capability.

Available capabilities:
${capabilitiesSchema}

Respond ONLY with a JSON object in this exact format:
{
  "capabilityId": "<id of selected capability>",
  "mode": "<direct|workflow|reasoning>",
  "confidence": <0.0-1.0>,
  "requiresApproval": <true|false>,
  "approvalReason": "<reason if requiresApproval is true, else null>",
  "reasoning": "<brief explanation>"
}`;
  }

  private _parseResponse(
    raw: string,
    fallbackCapabilityId: string
  ): SupervisionResult {
    try {
      // Strip markdown code blocks nếu có
      const clean = raw
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(clean);

      return {
        capabilityId: parsed.capabilityId ?? fallbackCapabilityId,
        mode: (parsed.mode as ExecutionMode) ?? "direct",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        requiresApproval: Boolean(parsed.requiresApproval),
        approvalReason: parsed.approvalReason ?? undefined,
        reasoning: parsed.reasoning ?? undefined,
      };
    } catch (err) {
      console.error("[Supervisor] Failed to parse LLM response:", raw, err);
      // Fallback an toàn
      return {
        capabilityId: fallbackCapabilityId,
        mode: "direct",
        confidence: 0.0,
        requiresApproval: false,
        reasoning: "Parse error - using fallback",
      };
    }
  }
}
