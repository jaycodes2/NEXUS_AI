// Simple interface to keep controllers clean
export interface AIClient {
  chat(prompt: string): Promise<string>;
}
