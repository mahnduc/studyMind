// FILE: core/agent/providers/provider-router.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: ProviderRouter - điều phối request tới LLM provider phù hợp.
//        Hỗ trợ đăng ký nhiều provider, fallback, và routing theo chiến lược.
//        Không biết về Groq hay bất kỳ provider cụ thể nào.

import {
  LLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
} from "./provider.interface";
import { StreamChunk } from "../runtime/types";

export type RoutingStrategy = "primary" | "round-robin" | "failover";

export interface ProviderRouterOptions {
  strategy?: RoutingStrategy;
  defaultProviderId?: string;
}

export class ProviderRouter {
  private readonly providers: Map<string, LLMProvider> = new Map();
  private readonly strategy: RoutingStrategy;
  private defaultProviderId: string | null = null;
  private roundRobinIndex = 0;

  constructor(options: ProviderRouterOptions = {}) {
    this.strategy = options.strategy ?? "primary";
    this.defaultProviderId = options.defaultProviderId ?? null;
  }

  // ── Registration ─────────────────────────────────────────

  register(provider: LLMProvider, asDefault = false): void {
    this.providers.set(provider.providerId, provider);
    if (asDefault || this.providers.size === 1) {
      this.defaultProviderId = provider.providerId;
    }
  }

  registerMany(providers: LLMProvider[], defaultId?: string): void {
    providers.forEach((p) => this.register(p));
    if (defaultId) {
      this.defaultProviderId = defaultId;
    }
  }

  // ── Routing ───────────────────────────────────────────────

  /**
   * Lấy provider theo chiến lược đã cấu hình.
   * @param preferredId - Ghi đè chiến lược, dùng provider cụ thể
   */
  resolve(preferredId?: string): LLMProvider {
    if (preferredId && this.providers.has(preferredId)) {
      return this.providers.get(preferredId)!;
    }

    if (this.providers.size === 0) {
      throw new Error("[ProviderRouter] No providers registered");
    }

    switch (this.strategy) {
      case "round-robin":
        return this._roundRobin();
      case "failover":
      case "primary":
      default:
        return this._primary();
    }
  }

  private _primary(): LLMProvider {
    if (this.defaultProviderId && this.providers.has(this.defaultProviderId)) {
      return this.providers.get(this.defaultProviderId)!;
    }
    return this.providers.values().next().value!;
  }

  private _roundRobin(): LLMProvider {
    const keys = Array.from(this.providers.keys());
    const key = keys[this.roundRobinIndex % keys.length];
    this.roundRobinIndex++;
    return this.providers.get(key)!;
  }

  // ── Proxy methods (convenience) ───────────────────────────

  async complete(
    messages: LLMMessage[],
    options?: LLMRequestOptions & { preferredProviderId?: string }
  ): Promise<LLMResponse> {
    const provider = this.resolve(options?.preferredProviderId);
    return provider.complete(messages, options);
  }

  async stream(
    messages: LLMMessage[],
    options?: LLMRequestOptions & { preferredProviderId?: string },
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    if (this.strategy === "failover") {
      return this._streamWithFailover(messages, options, onChunk);
    }
    const provider = this.resolve(options?.preferredProviderId);
    return provider.stream(messages, options, onChunk);
  }

  private async _streamWithFailover(
    messages: LLMMessage[],
    options?: LLMRequestOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    const providers = Array.from(this.providers.values());
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        return await provider.stream(messages, options, onChunk);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[ProviderRouter] Provider "${provider.providerId}" failed, trying next...`,
          lastError.message
        );
      }
    }

    throw lastError ?? new Error("[ProviderRouter] All providers failed");
  }

  // ── Utilities ─────────────────────────────────────────────

  listProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProviderId(): string | null {
    return this.defaultProviderId;
  }

  setDefault(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`[ProviderRouter] Provider not registered: "${providerId}"`);
    }
    this.defaultProviderId = providerId;
  }

  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  size(): number {
    return this.providers.size;
  }
}

// Singleton
export const providerRouter = new ProviderRouter({ strategy: "failover" });