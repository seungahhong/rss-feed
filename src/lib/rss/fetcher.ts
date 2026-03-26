import { parseRssFeed, type ParsedFeed } from './parser';

interface FetchOptions {
  etag?: string | null;
  lastModified?: string | null;
  timeoutMs?: number;
}

interface FetchResult {
  feed: ParsedFeed | null;
  etag: string | null;
  lastModified: string | null;
  notModified: boolean;
}

export async function fetchRssFeed(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const { etag, lastModified, timeoutMs = 10000 } = options;

  const headers: Record<string, string> = {
    'User-Agent': 'RSS-Feed-AI-Summary/1.0',
  };
  if (etag) headers['If-None-Match'] = etag;
  if (lastModified) headers['If-Modified-Since'] = lastModified;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });

    if (response.status === 304) {
      return { feed: null, etag: etag ?? null, lastModified: lastModified ?? null, notModified: true };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parseRssFeed(xml);

    return {
      feed,
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      notModified: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}
