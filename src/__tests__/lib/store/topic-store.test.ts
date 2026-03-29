import { sql } from '@vercel/postgres';
import { TopicStore } from '@/lib/store/topic-store';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

const mockedSql = sql as unknown as jest.Mock;

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 't1',
  name: 'AI/ML',
  label_ko: 'AI/ML',
  label_en: 'AI/ML',
  is_seed: true,
  created_at: new Date('2026-01-01'),
  ...overrides,
});

describe('TopicStore', () => {
  let store: TopicStore;

  beforeEach(() => {
    store = new TopicStore();
    jest.clearAllMocks();
  });

  it('should return all topics', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const topics = await store.getAll();
    expect(topics).toHaveLength(1);
    expect(topics[0].name).toBe('AI/ML');
    expect(topics[0].label.ko).toBe('AI/ML');
  });

  it('should find topic by name case-insensitively', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const found = await store.getByName('ai/ml');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('AI/ML');
  });

  it('should return null for non-existent topic', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [] });
    const found = await store.getByName('Non-existent');
    expect(found).toBeNull();
  });

  it('should not duplicate topics on add', async () => {
    // getByName returns existing
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const result = await store.add({ name: 'AI/ML', label: { ko: 'AI/ML', en: 'AI/ML' } });
    expect(result.name).toBe('AI/ML');
    // sql should only be called once (for getByName), no INSERT
    expect(mockedSql).toHaveBeenCalledTimes(1);
  });

  it('should return topic names', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [{ name: 'AI/ML' }, { name: 'Frontend' }] });
    const names = await store.getNames();
    expect(names).toEqual(['AI/ML', 'Frontend']);
  });

  it('should seed topics when empty', async () => {
    // COUNT returns 0
    mockedSql.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    // 12 INSERT calls for seed topics
    for (let i = 0; i < 12; i++) {
      mockedSql.mockResolvedValueOnce({ rows: [] });
    }
    await store.ensureSeedTopics();
    // 1 (count) + 12 (inserts) = 13 calls
    expect(mockedSql).toHaveBeenCalledTimes(13);
  });

  it('should skip seeding when topics exist', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [{ count: '5' }] });
    await store.ensureSeedTopics();
    expect(mockedSql).toHaveBeenCalledTimes(1);
  });
});
