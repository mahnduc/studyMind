// FILE: core/agent/runtime/event-emitter.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Pub/Sub event nội bộ - cầu nối giao tiếp giữa các module
//        Không biết về bất kỳ module cụ thể nào

type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

interface Subscription {
  id: string;
  eventType: string;
  handler: EventHandler<unknown>;
}

export class EventEmitter {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private subscriptionCounter = 0;

  /**
   * Đăng ký lắng nghe một loại sự kiện.
   * Trả về hàm hủy đăng ký.
   */
  on<T = unknown>(eventType: string, handler: EventHandler<T>): () => void {
    const id = `sub_${++this.subscriptionCounter}`;
    const subscription: Subscription = {
      id,
      eventType,
      handler: handler as EventHandler<unknown>,
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(subscription);

    // Trả về hàm unsubscribe
    return () => this.off(eventType, id);
  }

  /**
   * Đăng ký lắng nghe một lần duy nhất.
   */
  once<T = unknown>(eventType: string, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on<T>(eventType, (event) => {
      unsubscribe();
      return handler(event);
    });
    return unsubscribe;
  }

  /**
   * Hủy đăng ký theo subscriptionId.
   */
  private off(eventType: string, subscriptionId: string): void {
    const subs = this.subscriptions.get(eventType);
    if (!subs) return;
    const filtered = subs.filter((s) => s.id !== subscriptionId);
    if (filtered.length === 0) {
      this.subscriptions.delete(eventType);
    } else {
      this.subscriptions.set(eventType, filtered);
    }
  }

  /**
   * Phát ra sự kiện - thực thi tất cả handlers đã đăng ký.
   * Lỗi trong handler không làm dừng các handler còn lại.
   */
  async emit<T = unknown>(eventType: string, payload: T): Promise<void> {
    const subs = this.subscriptions.get(eventType) ?? [];
    const wildcardSubs = this.subscriptions.get("*") ?? [];
    const allSubs = [...subs, ...wildcardSubs];

    await Promise.allSettled(
      allSubs.map((sub) => {
        try {
          return Promise.resolve(sub.handler(payload));
        } catch (err) {
          console.error(
            `[EventEmitter] Handler error for event "${eventType}":`,
            err
          );
          return Promise.resolve();
        }
      })
    );
  }

  /**
   * Lấy danh sách các event type đang có subscriber.
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Xóa tất cả subscriptions - dùng khi teardown.
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.subscriptions.delete(eventType);
    } else {
      this.subscriptions.clear();
    }
  }
}

// Singleton global event bus dùng xuyên suốt ứng dụng
export const globalEventBus = new EventEmitter();
