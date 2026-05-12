import {
  callGroqApi,
  callGroqApiStream,
} from "./groq/groq.config";

import { LLMProvider } from "./provider.interface";

export class GroqProvider implements LLMProvider {
  // không stream
  // async chat(input: any) {
  //   const apiKey = "";
  //   return callGroqApi(
  //     {
  //       model: "llama-3.3-70b-versatile",
  //       messages: input.messages,
  //       tools: input.tools,
  //       tool_choice: "auto",
  //       temperature: 0.7,
  //       max_tokens: 2048,
  //     },
  //     apiKey
  //   );
  // }

  async *chatStream(input: any) {
    const apiKey = "";

    yield* callGroqApiStream(
      {
        model: "llama-3.3-70b-versatile",
        messages: input.messages,
        tools: input.tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2048,
      },
      apiKey
    );
  }
}