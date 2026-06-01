type AsyncCallback = (code: string) => void | Promise<void>;

class AppEventEmitter {
  private events: Map<string, AsyncCallback[]> = new Map();

  on(eventName: string, callback: AsyncCallback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(callback);
    console.log(`[EventEmitter] Đã đăng ký cổng nghe cho: ${eventName}`);
  }

  off(eventName: string, callback: AsyncCallback): void {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return;

    const filteredCallbacks = callbacks.filter((cb) => cb !== callback);

    if (filteredCallbacks.length === 0) {
      this.events.delete(eventName);
    } else {
      this.events.set(eventName, filteredCallbacks);
    }
    console.log(`[EventEmitter] Đã hủy cổng nghe cho: ${eventName}`);
  }

  async emit(eventName: string, code: string): Promise<void> {
    const callbacks = this.events.get(eventName);
    console.log(`[EventEmitter] Đang phát tên: ${eventName}. Số bộ thu đang nghe: ${callbacks?.length || 0}`);

    if (!callbacks?.length) return;

    await Promise.all(
      callbacks.map(async (callback) => {
        try {
          await callback(code);
        } catch (err) {
          console.error(err);
        }
      })
    );
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.events.delete(eventName);
      console.log(`[EventEmitter] Đã xóa toàn bộ listener của ${eventName}`);
      return;
    }
    this.events.clear();
    console.log(`[EventEmitter] Đã xóa toàn bộ listener`);
  }
}

const globalForEmitter = globalThis as unknown as { appEmitter: AppEventEmitter };
export const appEmitter = globalForEmitter.appEmitter || new AppEventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter.appEmitter = appEmitter;
}