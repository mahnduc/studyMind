// FILE: core/agent/capabilities/registry.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: CapabilityRegistry - quản lý đăng ký capability theo cơ chế
//        "Plug and Play". File này KHÔNG biết về bất kỳ capability cụ thể.
//        Mọi capability đều tự đăng ký vào đây.

import { CapabilityDefinition } from "./types";

export class CapabilityRegistry {
  private readonly store: Map<string, CapabilityDefinition> = new Map();

  /**
   * Đăng ký một capability.
   * Gọi trong file bootstrap.ts - không gọi trực tiếp từ runtime.
   */
  register(capability: CapabilityDefinition): void {
    if (this.store.has(capability.id)) {
      console.warn(
        `[CapabilityRegistry] Overwriting existing capability: "${capability.id}"`
      );
    }
    this.store.set(capability.id, Object.freeze(capability));
  }

  /**
   * Đăng ký nhiều capabilities cùng lúc.
   */
  registerMany(capabilities: CapabilityDefinition[]): void {
    capabilities.forEach((c) => this.register(c));
  }

  /**
   * Tra cứu capability theo ID.
   */
  get(id: string): CapabilityDefinition | undefined {
    return this.store.get(id);
  }

  /**
   * Lấy tất cả capabilities - Supervisor dùng để phân loại.
   */
  listAll(): CapabilityDefinition[] {
    return Array.from(this.store.values());
  }

  /**
   * Kiểm tra capability đã được đăng ký chưa.
   */
  has(id: string): boolean {
    return this.store.has(id);
  }

  /**
   * Hủy đăng ký một capability (hot-reload / testing).
   */
  unregister(id: string): boolean {
    return this.store.delete(id);
  }

  /**
   * Tổng số capability đã đăng ký.
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Danh sách ID đã đăng ký.
   */
  listIds(): string[] {
    return Array.from(this.store.keys());
  }
}

// Singleton - dùng xuyên suốt ứng dụng
export const capabilityRegistry = new CapabilityRegistry();
