import { toolList } from "../_utils/toolList";

export const callGroqChat = async (
  randomKey: string,
  messages: any[],      // context
  userContent: string   // chat cụ thể
) => {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${randomKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userContent },
        ],
        tools: toolList,
        tool_choice: "auto",
      }),
    }
  );

  const data = await response.json();

  // debug
  console.log("--- GROQ API RESPONSE RAW ---", data);

  if (data?.choices?.[0]?.message) {
    const msg = data.choices[0].message;
    
    if (msg.tool_calls) {
      console.log("AI đang gọi Tool:", msg.tool_calls);
    } else {
      console.log("AI trả lời Text:", msg.content);
    }
  } else if (data.error) {
    console.error("Lỗi từ Groq API:", data.error);
  }

  return {
    ok: response.ok,
    data,
  };
};