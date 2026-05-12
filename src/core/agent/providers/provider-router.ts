import { GroqProvider } from "./groq.provider";
import { LLMProvider } from "./provider.interface";

export class ProviderRouter {
  private groq = new GroqProvider();

  getProvider() : LLMProvider {
    return this.groq;
  }
}