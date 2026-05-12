// runtime/reasoning-loop.ts
interface Params {
  session: any;
  provider: any;
  tools: any;
  events: any;
  maxIterations: number;
}

// export async function reasoningLoop({
//   session,
//   provider,
//   tools,
//   events,
//   maxIterations,
// }: {
//   session: any;
//   provider: any;
//   tools: any;
//   events: any;
//   maxIterations: number;
// }) {
//   // Biến cục bộ để theo dõi vòng lặp của phiên chạy 
//   let currentIteration = 0;

//   while (currentIteration < maxIterations) {
//     // Gửi yêu cầu đến Provider (LLM)
//     const response = await provider.chat({
//       messages: session.getMessages(),
//       tools: tools.getDefinitions(),
//     });

//     const assistantMessage = response.choices[0].message;

//     // Lưu tin nhắn của Assistant
//     session.addMessage({
//       role: "assistant",
//       content: assistantMessage.content || "",
//       tool_calls: assistantMessage.tool_calls,
//     });
//     events.emit("messages_updated", session.getMessages());

//     // Kết thúc nếu không cần gọi tool
//     if (!assistantMessage.tool_calls?.length) {
//       events.emit("response", assistantMessage.content);
//       return assistantMessage.content;
//     }

//     // Xử lý Tool Execution
//     events.emitBusy();

//     for (const toolCall of assistantMessage.tool_calls) {
//       const toolName = toolCall.function.name;
//       const tool = tools.get(toolName);

//       if (!tool) {
//         session.addMessage({
//           role: "tool",
//           tool_call_id: toolCall.id,
//           content: JSON.stringify({ error: `Tool "${toolName}" not found.` }),
//         });
//         continue;
//       }

//       try {
//         const args = JSON.parse(toolCall.function.arguments || "{}");
//         events.emit("tool_start", { name: toolName, args });

//         const result = await tool.execute(args);

//         session.addMessage({
//           role: "tool",
//           tool_call_id: toolCall.id,
//           content: JSON.stringify(result),
//         });

//         events.emit("tool_end", { name: toolName, result });
//       } catch (error: any) {
//         session.addMessage({
//           role: "tool",
//           tool_call_id: toolCall.id,
//           content: JSON.stringify({ error: "Execution failed", message: error.message }),
//         });
//       }
//     }

//     // Tăng biến đếm và tiếp tục vòng lặp
//     currentIteration++;
//     events.emitThinking(); 
//   }

//   throw new Error(`Agent reached max_iterations (${maxIterations}) without a final response.`);
// }

export async function* reasoningLoopStream({
  session,
  provider,
  events,
}: Params) {
  /**
   * Tạo assistant placeholder
   */
  const assistantMessage = {
    role: "assistant",
    content: "",
  };

  session.addMessage(assistantMessage);
  /**
   * Báo UI update ngay
   */
  events.emit("messages_updated",session.getMessages());

  const stream = provider.chatStream({
    messages: session.getMessages(),
  });

  let finalText = "";

  events.emit("streaming");
  for await (const chunk of stream) {
    finalText += chunk;
    /**
     * Update realtime content
     */
    assistantMessage.content = finalText;

    /**
     * Trigger rerender UI
     */
    events.emit("messages_updated",session.getMessages());

    yield {
      type: "token",
      content: chunk,
    };
  }

  assistantMessage.content = finalText;

  events.emit("messages_updated", session.getMessages());
  events.emit("response", finalText);

  yield {
    type: "done",
    content: finalText,
  };
}