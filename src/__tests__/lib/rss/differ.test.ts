import { diffArticles, filterBySnapshot } from '@/lib/rss/differ';
import type { Article } from '@/types';

const makeArticle = (overrides: Partial<Article> = {}): Article => ({
  id: 'existing-1',
  feedId: 'feed-1',
  guid: 'guid-1',
  title: 'Existing',
  link: 'https://example.com/1',
  content: 'content',
  contentSnippet: 'content',
  author: '',
  publishedAt: '2026-03-18T00:00:00Z',
  contentHash: 'hash-original',
  fetchedAt: '2026-03-18T00:01:00Z',
  topic: 'Uncategorized',
  ...overrides,
});

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

const makeParsedItem = (overrides: Partial<ParsedItem> = {}): ParsedItem => ({
  guid: 'guid-1',
  title: 'Parsed',
  link: 'https://example.com/1',
  content: 'content',
  contentSnippet: 'content',
  author: '',
  publishedAt: '2026-03-18T00:00:00Z',
  contentHash: 'hash-original',
  ...overrides,
});

describe('diffArticles', () => {
  it('should detect new articles (guid not in existing)', () => {
    const existing: Article[] = [makeArticle({ guid: 'guid-1' })];
    const parsed = [
      makeParsedItem({ guid: 'guid-1' }),
      makeParsedItem({ guid: 'guid-2', title: 'New' }),
    ];
    const diff = diffArticles(existing, parsed);
    expect(diff.newItems).toHaveLength(1);
    expect(diff.newItems[0].guid).toBe('guid-2');
    expect(diff.updatedItems).toHaveLength(0);
  });

  it('should detect updated articles (same guid, different contentHash)', () => {
    const existing: Article[] = [makeArticle({ guid: 'guid-1', contentHash: 'old-hash' })];
    const parsed = [makeParsedItem({ guid: 'guid-1', contentHash: 'new-hash' })];
    const diff = diffArticles(existing, parsed);
    expect(diff.newItems).toHaveLength(0);
    expect(diff.updatedItems).toHaveLength(1);
    expect(diff.updatedItems[0].item.contentHash).toBe('new-hash');
    expect(diff.updatedItems[0].existingId).toBe('existing-1');
  });

  it('should skip unchanged articles', () => {
    const existing: Article[] = [makeArticle({ guid: 'guid-1', contentHash: 'same-hash' })];
    const parsed = [makeParsedItem({ guid: 'guid-1', contentHash: 'same-hash' })];
    const diff = diffArticles(existing, parsed);
    expect(diff.newItems).toHaveLength(0);
    expect(diff.updatedItems).toHaveLength(0);
  });

  it('should handle empty existing articles', () => {
    const parsed = [makeParsedItem({ guid: 'guid-1' }), makeParsedItem({ guid: 'guid-2' })];
    const diff = diffArticles([], parsed);
    expect(diff.newItems).toHaveLength(2);
  });

  it('should handle empty parsed items', () => {
    const existing: Article[] = [makeArticle()];
    const diff = diffArticles(existing, []);
    expect(diff.newItems).toHaveLength(0);
    expect(diff.updatedItems).toHaveLength(0);
  });
});

describe('filterBySnapshot', () => {
  it('should return all items when snapshotAt is null', () => {
    const items = [
      makeParsedItem({ guid: 'g1', publishedAt: '2024-01-01T00:00:00Z' }),
      makeParsedItem({ guid: 'g2', publishedAt: '2026-01-01T00:00:00Z' }),
    ];
    const result = filterBySnapshot(items, null);
    expect(result).toHaveLength(2);
  });

  it('should filter out items published before snapshotAt', () => {
    const items = [
      makeParsedItem({ guid: 'g1', publishedAt: '2026-03-01T00:00:00Z' }),
      makeParsedItem({ guid: 'g2', publishedAt: '2026-03-20T00:00:00Z' }),
      makeParsedItem({ guid: 'g3', publishedAt: '2026-03-25T00:00:00Z' }),
    ];
    const result = filterBySnapshot(items, '2026-03-15T00:00:00Z');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.guid)).toEqual(['g2', 'g3']);
  });

  it('should include items with invalid/empty publishedAt (safe direction)', () => {
    const items = [
      makeParsedItem({ guid: 'g1', publishedAt: '' }),
      makeParsedItem({ guid: 'g2', publishedAt: 'invalid-date' }),
      makeParsedItem({ guid: 'g3', publishedAt: '2026-03-25T00:00:00Z' }),
    ];
    const result = filterBySnapshot(items, '2026-03-15T00:00:00Z');
    expect(result).toHaveLength(3);
  });

  it('should include items published exactly at snapshotAt', () => {
    const items = [
      makeParsedItem({ guid: 'g1', publishedAt: '2026-03-15T00:00:00Z' }),
    ];
    const result = filterBySnapshot(items, '2026-03-15T00:00:00Z');
    expect(result).toHaveLength(1);
  });
});
