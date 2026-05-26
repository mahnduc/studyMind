// src/core/agent/orchestrator.ts
import { GROQ_DEFAULT_MODEL } from "@/utils/constant";
import { AgentConfig, AgentSession, ChatMessage, ToolCall, ToolResult } from "./types";
import { requestGroq } from "./gateway";
import { buildMessages, initializeAgentState } from "./context";

interface ChatInput {
  message: string;
  agent: AgentConfig;
  session: AgentSession;
}

// Logic thực thi công cụ
async function executeToolCall(
  toolCall: ToolCall,
  agent: AgentConfig,
  session: AgentSession
): Promise<ChatMessage> {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments || "{}");
  const executor = agent.executors?.find((tool) => tool.name === functionName);

  if (!executor) {
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      name: functionName,
      content: JSON.stringify({ success: false, error: `Tool "${functionName}" not found` }),
    };
  }

  try {
    const result: ToolResult = await executor.execute(args, session);
    return { role: "tool", tool_call_id: toolCall.id, name: functionName, content: JSON.stringify(result) };
  } catch (error: any) {
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      name: functionName,
      content: JSON.stringify({ success: false, error: error?.message || "Tool execution error" }),
    };
  }
}

// HÀM ĐIỀU PHỐI CHÍNH (Chỉ thuần túy quản lý luồng lặp)
export async function groqChat({ message, agent, session }: ChatInput): Promise<string> {
  initializeAgentState(agent, session);
  
  session.history.push({ role: "user", content: message });

  while (!session.state.isFinished && session.state.step < session.state.maxSteps) {
    session.state.step++;

    const messages = buildMessages(agent, session);

    // Giao việc cho Gateway gọi LLM
    const data = await requestGroq({
      model: agent.model || GROQ_DEFAULT_MODEL,
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.maxTokens ?? 1024,
      messages,
      tools: agent.tools,
      tool_choice: "auto",
    });

    const assistantMessage = data.choices[0].message;

    session.history.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls,
    });

    if (!assistantMessage.tool_calls) {
      session.state.isFinished = true;
      return assistantMessage.content;
    }

    // Điều phối thực thi hàng loạt các Tool Calls
    const toolExecutions = assistantMessage.tool_calls.map((toolCall: ToolCall) =>
      executeToolCall(toolCall, agent, session)
    );
    
    const toolMessages = await Promise.all(toolExecutions);
    session.history.push(...toolMessages);
  }

  return "Agent stopped: max steps reached.";
}