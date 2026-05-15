// FILE: core/agent/workflows/workflow-registry.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: WorkflowRegistry - quản lý đăng ký workflows.
//        Không biết về bất kỳ workflow cụ thể nào.

import { WorkflowDefinition } from "./types";

export class WorkflowRegistry {
  private readonly store: Map<string, WorkflowDefinition> = new Map();

  register(workflow: WorkflowDefinition): void {
    if (this.store.has(workflow.id)) {
      console.warn(
        `[WorkflowRegistry] Overwriting existing workflow: "${workflow.id}"`
      );
    }
    this.store.set(workflow.id, workflow);
  }

  registerMany(workflows: WorkflowDefinition[]): void {
    workflows.forEach((w) => this.register(w));
  }

  get(id: string): WorkflowDefinition | undefined {
    return this.store.get(id);
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  unregister(id: string): boolean {
    return this.store.delete(id);
  }

  listAll(): WorkflowDefinition[] {
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
export const workflowRegistry = new WorkflowRegistry();
