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
    return { 
      role: "tool", 
      tool_call_id: toolCall.id, 
      name: functionName, 
      content: JSON.stringify(result) 
    };
  } catch (error: any) {
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      name: functionName,
      content: JSON.stringify({ success: false, error: error?.message || "Tool execution error" }),
    };
  }
}

// HÀM ĐIỀU PHỐI CHÍNH (Đã fix lỗi Payload Groq)
export async function groqChat({ message, agent, session }: ChatInput): Promise<string> {
  initializeAgentState(agent, session);
  
  session.history.push({ role: "user", content: message });

  while (!session.state.isFinished && session.state.step < session.state.maxSteps) {
    session.state.step++;

    const messages = buildMessages(agent, session);

    // 1. CHUẨN BỊ PAYLOAD AN TOÀN CHO GROQ
    const requestBody: Record<string, any> = {
      model: agent.model || GROQ_DEFAULT_MODEL,
      temperature: agent.temperature ?? 0.2, // Giảm xuống 0.2 cho Agent ổn định cấu trúc JSON
      max_tokens: agent.maxTokens ?? 1024,
      messages,
    };

    // Chỉ đính kèm tools nếu mảng thực sự có phần tử để tránh lỗi 400 Bad Request
    if (agent.tools && agent.tools.length > 0) {
      requestBody.tools = agent.tools;
      requestBody.tool_choice = "auto";
    }

    // Giao việc cho Gateway gọi LLM
    const data = await requestGroq(requestBody);

    if (!data?.choices?.[0]?.message) {
      throw new Error("Không nhận được phản hồi hợp lệ từ Groq API.");
    }

    const assistantMessage = data.choices[0].message;

    // 2. CHUẨN HÓA MESSAGE KHI PUSH VÀO HISTORY
    const newAssistantMessage: ChatMessage = {
      role: "assistant",
      content: assistantMessage.content || "",
    };

    // Nếu LLM thực sự có gọi tools, lọc sạch và ép đúng format OpenAI/Groq trước khi lưu history
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      newAssistantMessage.tool_calls = assistantMessage.tool_calls.map((tc: any) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));
    }

    session.history.push(newAssistantMessage);

    // Nếu không cần gọi thêm công cụ nào nữa thì dừng vòng lặp
    if (!newAssistantMessage.tool_calls || newAssistantMessage.tool_calls.length === 0) {
      session.state.isFinished = true;
      return newAssistantMessage.content || "";
    }

    // Điều phối thực thi hàng loạt các Tool Calls
    const toolExecutions = newAssistantMessage.tool_calls.map((toolCall: ToolCall) =>
      executeToolCall(toolCall, agent, session)
    );
    
    const toolMessages = await Promise.all(toolExecutions);
    session.history.push(...toolMessages);
  }

  return "Agent stopped: max steps reached.";
}