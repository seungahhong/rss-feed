import type { SupportedLocale } from '@/types';

const LANG_INSTRUCTIONS: Record<SupportedLocale, { lang: string; instruction: string }> = {
  ko: {
    lang: '한국어',
    instruction: '다음 기사를 한국어로 요약해주세요.',
  },
  en: {
    lang: 'English',
    instruction: 'Summarize the following article in English.',
  },
};

export function buildSummaryPrompt(
  title: string,
  content: string,
  locale: SupportedLocale,
): string {
  const { lang, instruction } = LANG_INSTRUCTIONS[locale];

  return `${instruction}

Rules:
- "title": 1-2 lines summary title in ${lang}
- "description": 10 lines or less detailed summary in ${lang}
- Output ONLY valid JSON with "title" and "description" fields
- Do not include any text outside the JSON

Article Title: ${title}

Article Content:
${content.slice(0, 4000)}

Respond with JSON only:`;
}
