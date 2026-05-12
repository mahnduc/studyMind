import {
  GroqChatRequest,
  GroqHttpBody,
  GroqActionResult,
  GroqChatCompletion,
} from "../_types/groq.types";

//GroqChatCompletion: cấu trúc dữ liệu định nghĩa dữ liệu phản hồi của groq
export const callGroqChat = async <T = GroqChatCompletion>(request: GroqChatRequest): Promise<GroqActionResult<T>> => {
  const {
    apiKey,
    model,
    messages,
    tools,
    tool_choice = "auto",
    stream = false,
    sampling,
    response_format,
    metadata,
    timeoutMs = 30000,
    signal,
  } = request;

  // Tạo body Groq API
  const payload: GroqHttpBody = {
    model,
    messages,
    tools,
    tool_choice,
    stream,
    response_format,

    // Flatten sampling config
    temperature: sampling?.temperature,
    top_p: sampling?.top_p,
    max_tokens: sampling?.max_tokens,
    frequency_penalty: sampling?.frequency_penalty,
    presence_penalty: sampling?.presence_penalty,
    stop: sampling?.stop,
  };

  // Loại bỏ các field undefined
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  // Thiết lập timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanPayload),
        signal: signal ?? controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    // Xử lý lỗi HTTP
    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data?.error?.message || "Unknown error",
          code: data?.error?.code,
          status: response.status,
        },
        metadata,
      };
    }

    // Thành công
    return {
      success: true,
      data: data as T,
      metadata,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Lỗi mạng / timeout / abort
    return {
      success: false,
      error: {
        message: err?.message || "Network Error",
        code: err?.name,
      },
      metadata,
    };
  }
};