import { ProviderRouter } from "../providers/provider-router";
import { ToolRegistry } from "../tools/tool-registry";
import { reasoningLoopStream } from "./reasoning-loop";
import { ConversationSession } from "./conversation-session";
import { RuntimeEventEmitter } from "./event-emitter";
import { AgentState } from "../state/agent-state";

export class AgentRuntime {
  private readonly DEFAULT_MAX_ITERATIONS = 10;
  private providerRouter = new ProviderRouter();
  private tools = new ToolRegistry();
  public events = new RuntimeEventEmitter();
  private session = new ConversationSession();
  private _state: AgentState = "idle";

  constructor() {
    this.events.onStateChange((state: AgentState) => {
      this._state = state;
    });
  }

  get state() { return this._state; }
  // không stream
  // async run(userInput: string, options?: { maxIterations?: number }) {
  //   const maxIterations = options?.maxIterations ?? this.DEFAULT_MAX_ITERATIONS;
    
  //   try {
  //     this.session.addMessage({ role: "user", content: userInput });
  //     return await this.handleReasoningFlow(maxIterations);
  //   } catch (error: any) {
  //     this.events.emitError(error.message || "Unknown error");
  //     throw error;
  //   }
  // }

  async *runStream(
    userInput: string,
    options?: { maxIterations?: number }
  ) {
    const maxIterations =
      options?.maxIterations ??
      this.DEFAULT_MAX_ITERATIONS;

    try {
      this.session.addMessage({
        role: "user",
        content: userInput,
      });

      yield* this.handleReasoningFlowStream(
        maxIterations
      );

    } catch (error: any) {
      this.events.emitError(
        error.message || "Unknown error"
      );

      throw error;
    }
  }
  // xử lý không stream
  // private async handleReasoningFlow(maxIterations: number) {
  //   this.events.emitThinking();
    
  //   const provider = this.providerRouter.getProvider();
    
  //   try {
  //     const result = await reasoningLoop({
  //       session: this.session,
  //       provider,
  //       tools: this.tools,
  //       events: this.events,
  //       maxIterations,
  //     });

  //     this.events.emitCompleted();
  //     this.events.emitIdle();

  //     return {
  //       type: "response",
  //       payload: result,
  //     };
  //   } catch (error: any) {
  //     this.events.emitError(error.message || "Reasoning flow failed");
  //     throw error;
  //   }
  // }

  private async *handleReasoningFlowStream(maxIterations: number) {
    this.events.emitThinking();
    const provider = this.providerRouter.getProvider();

    try {
      yield* reasoningLoopStream({
        session: this.session,
        provider,
        tools: this.tools,
        events: this.events,
        maxIterations,
      });

      this.events.emitCompleted();
      this.events.emitIdle();

    } catch (error: any) {
      this.events.emitError(error.message || "Reasoning flow failed");
      throw error;
    }
  }
}