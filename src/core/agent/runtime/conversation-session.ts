import { ChatMessage } from "../types/chat.types";

export class ConversationSession {
  private messages: ChatMessage[] = [];

  addMessage(message: ChatMessage) {
    this.messages.push(message);
  }

  // getMessages(): ChatMessage[] {
  //   return this.messages;
  // }
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clearMessages() {
    this.messages = [];
  }
}