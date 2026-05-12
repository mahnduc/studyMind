// event-emitter.ts
import EventEmitter from "events";

export class RuntimeEventEmitter extends EventEmitter {
  emitIdle() { this.emit("idle"); }
  emitThinking() { this.emit("thinking"); }
  emitBusy() { this.emit("busy"); }
  emitWaiting() { this.emit("waiting"); }
  emitError(msg?: string) { this.emit("error", msg); }
  emitCompleted() { this.emit("completed"); }
  
  // Shortcut để đăng ký hàng loạt
  onStateChange(handler: (state: any) => void) {
    const states = ["idle", "thinking", "busy", "waiting", "error", "completed"];
    states.forEach(state => this.on(state, () => handler(state)));
  }
}