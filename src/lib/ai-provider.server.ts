import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Direct Claude API provider (replaces the old Lovable AI Gateway pass-through).
 * Requires ANTHROPIC_API_KEY to be set in the environment (Vercel project settings).
 */
export function createClaudeProvider(apiKey: string) {
  return createAnthropic({ apiKey });
}
