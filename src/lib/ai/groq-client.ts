import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function groqChatCompletion(
  messages: GroqChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const client = getGroqClient();
  if (!client) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 512,
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function translateSummary(
  title: string,
  description: string,
  targetLang: 'ko' | 'en',
): Promise<{ title: string; description: string }> {
  const langName = targetLang === 'ko' ? 'Korean' : 'English';

  let raw = '';
  try {
    raw = await groqChatCompletion(
      [
        {
          role: 'system',
          content: `Translate the following article summary to ${langName}. Return ONLY valid JSON: {"title": "...", "description": "..."}`,
        },
        { role: 'user', content: JSON.stringify({ title, description }) },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );

    const parsed = JSON.parse(raw);
    if (parsed.title && parsed.description) return parsed;
  } catch {
    // Try extracting JSON from raw response
    try {
      const match = raw.match(/\{[\s\S]*"title"[\s\S]*"description"[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.title && parsed.description) return parsed;
      }
    } catch {
      // Fall through
    }
  }

  return { title, description };
}
