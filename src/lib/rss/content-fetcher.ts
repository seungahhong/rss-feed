import { convert } from 'html-to-text';

const FETCH_TIMEOUT = 15_000;
const MAX_CONTENT_LENGTH = 50_000;

/**
 * Fetch the actual web page content from an article URL and extract plain text.
 */
export async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSFeedBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    const html = await response.text();

    // Remove script, style, nav, header, footer tags before converting
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '');

    const text = convert(cleaned, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    });

    // Trim to max length
    const trimmed = text.slice(0, MAX_CONTENT_LENGTH).trim();
    if (trimmed.length < 100) return null;

    return trimmed;
  } catch {
    return null;
  }
}
