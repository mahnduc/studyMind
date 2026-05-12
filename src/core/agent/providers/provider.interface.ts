import { ChatMessage } from "../types/chat.types";

export interface LLMProvider {
  // respone không stream
  // chat(input: {
  //   messages: ChatMessage[];
  //   tools?: any[];
  // }): Promise<any>;

  chatStream(input: {
    messages: ChatMessage[];
    tools?: any[];
  }): AsyncGenerator<string>;
}