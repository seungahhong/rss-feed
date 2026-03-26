import type { SupportedLocale } from '@/types';
import { buildSummaryPrompt } from './prompts';

interface SummaryResult {
  title: string;
  description: string;
}

interface OllamaGenerateResponse {
  response: string;
}

export function parseSummaryResponse(raw: string): SummaryResult {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.title && parsed.description) return parsed;
  } catch {
    // Continue to extraction
  }

  // Try extracting from markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.title && parsed.description) return parsed;
    } catch {
      // Continue
    }
  }

  // Try extracting JSON object from text
  const jsonMatch = raw.match(/\{[\s\S]*"title"[\s\S]*"description"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && parsed.description) return parsed;
    } catch {
      // Continue
    }
  }

  throw new Error('Failed to parse summary response: no valid JSON with title and description');
}

export async function summarizeArticle(
  title: string,
  content: string,
  locale: SupportedLocale,
  ollamaUrl: string,
  model: string,
): Promise<SummaryResult> {
  const prompt = buildSummaryPrompt(title, content, locale);

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 512,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  return parseSummaryResponse(data.response);
}
