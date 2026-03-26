import { groqChatCompletion, isGroqAvailable } from './groq-client';

interface ArticleInput {
  title: string;
  contentSnippet: string;
}

interface ClassificationResult {
  title: string;
  topic: string;
}

export function buildTopicClassificationPrompt(
  articles: ArticleInput[],
  existingTopics: string[],
): string {
  const topicList = existingTopics.join(', ');
  const articleList = articles
    .map((a, i) => `[${i + 1}] Title: ${a.title}\nSnippet: ${a.contentSnippet.slice(0, 200)}`)
    .join('\n\n');

  return `You are a topic classifier for technical articles. Classify each article into exactly one topic.

## Available topics:
${topicList}

## Rules:
1. Choose from the available topics above whenever possible.
2. Only create a new topic if the article truly does not fit any existing topic.
3. New topics must be in English, concise (1-3 words), and follow the same naming style.
4. Respond ONLY with valid JSON array.

## Articles to classify:
${articleList}

## Response format (JSON array):
[{"title": "article title", "topic": "TopicName"}, ...]`;
}

export async function classifyArticleTopics(
  articles: ArticleInput[],
  existingTopics: string[],
): Promise<Map<string, string>> {
  if (!isGroqAvailable() || articles.length === 0) {
    const result = new Map<string, string>();
    for (const a of articles) {
      result.set(a.title, 'Uncategorized');
    }
    return result;
  }

  const prompt = buildTopicClassificationPrompt(articles, existingTopics);

  try {
    const response = await groqChatCompletion(
      [
        { role: 'system', content: 'You are a precise topic classifier. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.1, maxTokens: 1024 },
    );

    const parsed = parseClassificationResponse(response);
    const result = new Map<string, string>();

    for (const item of parsed) {
      result.set(item.title, item.topic || 'Uncategorized');
    }

    // Fill in any missing articles
    for (const a of articles) {
      if (!result.has(a.title)) {
        result.set(a.title, 'Uncategorized');
      }
    }

    return result;
  } catch (error) {
    console.error('Topic classification failed:', error);
    const result = new Map<string, string>();
    for (const a of articles) {
      result.set(a.title, 'Uncategorized');
    }
    return result;
  }
}

export function parseClassificationResponse(raw: string): ClassificationResult[] {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Continue to extraction
  }

  // Try extracting from markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Continue
    }
  }

  // Try extracting JSON array from text
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Continue
    }
  }

  return [];
}
