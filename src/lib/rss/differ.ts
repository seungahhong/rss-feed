import type { Article } from '@/types';

interface ParsedItem {
  guid: string;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  author: string;
  publishedAt: string;
  contentHash: string;
}

interface UpdatedItem {
  existingId: string;
  item: ParsedItem;
}

export interface DiffResult {
  newItems: ParsedItem[];
  updatedItems: UpdatedItem[];
}

export function filterBySnapshot(items: ParsedItem[], snapshotAt: string | null): ParsedItem[] {
  if (!snapshotAt) return items;

  const snapshotTime = new Date(snapshotAt).getTime();
  return items.filter((item) => {
    const publishedTime = new Date(item.publishedAt).getTime();
    // Include items with invalid dates (safe direction)
    if (isNaN(publishedTime)) return true;
    return publishedTime >= snapshotTime;
  });
}

export function diffArticles(existing: Article[], parsed: ParsedItem[]): DiffResult {
  const existingByGuid = new Map(existing.map((a) => [a.guid, a]));

  const newItems: ParsedItem[] = [];
  const updatedItems: UpdatedItem[] = [];

  for (const item of parsed) {
    const found = existingByGuid.get(item.guid);
    if (!found) {
      newItems.push(item);
    } else if (found.contentHash !== item.contentHash) {
      updatedItems.push({ existingId: found.id, item });
    }
  }

  return { newItems, updatedItems };
}
