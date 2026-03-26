import RSSParser from 'rss-parser';
import { convert } from 'html-to-text';
import { createHash } from 'crypto';

export interface ParsedFeedItem {
  guid: string;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  author: string;
  publishedAt: string;
  contentHash: string;
}

export interface ParsedFeed {
  title: string;
  description: string;
  link: string;
  items: ParsedFeedItem[];
}

const parser = new RSSParser();

function stripHtml(html: string): string {
  return convert(html, { wordwrap: false });
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function parseRssFeed(xml: string): Promise<ParsedFeed> {
  const feed = await parser.parseString(xml);

  const items: ParsedFeedItem[] = (feed.items || []).map((item) => {
    const rawContent = item['content:encoded'] || item.content || item.contentSnippet || '';
    const snippet = stripHtml(rawContent);

    return {
      guid: item.guid || item.id || item.link || '',
      title: item.title || '',
      link: item.link || '',
      content: rawContent,
      contentSnippet: snippet,
      author: item.creator || item.author || '',
      publishedAt: item.isoDate || item.pubDate || '',
      contentHash: hashContent(rawContent),
    };
  });

  return {
    title: feed.title || '',
    description: feed.description || '',
    link: feed.link || '',
    items,
  };
}
