import { sql } from '@vercel/postgres';
import { SummaryStore } from '@/lib/store/summary-store';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

const mockedSql = sql as unknown as jest.Mock;

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  article_id: 'a1',
  lang: 'ko',
  title: 'Summary Title',
  description: 'Summary description',
  generated_at: new Date('2026-03-18'),
  model: 'llama3',
  status: 'summarized',
  ...overrides,
});

describe('SummaryStore', () => {
  let store: SummaryStore;

  beforeEach(() => {
    store = new SummaryStore();
    jest.clearAllMocks();
  });

  it('should return summaries by article id', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const summaries = await store.getByArticleId('a1');
    expect(summaries).toHaveLength(1);
    expect(summaries[0].articleId).toBe('a1');
  });

  it('should add a summary', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const summary = await store.add({
      articleId: 'a1', lang: 'ko', title: 'Summary Title',
      description: 'Summary description', model: 'llama3',
    });
    expect(summary.status).toBe('summarized');
  });

  it('should delete by article id', async () => {
    mockedSql.mockResolvedValueOnce({ rowCount: 2 });
    const count = await store.deleteByArticleId('a1');
    expect(count).toBe(2);
  });

  it('should search summaries', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow({ title: 'React Guide' })] });
    const results = await store.search('react');
    expect(results).toHaveLength(1);
  });
});
