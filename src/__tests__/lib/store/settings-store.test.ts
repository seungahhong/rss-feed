import { sql } from '@vercel/postgres';
import { SettingsStore } from '@/lib/store/settings-store';
import { DEFAULT_SETTINGS } from '@/types';

jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

const mockedSql = sql as unknown as jest.Mock;

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    store = new SettingsStore();
    jest.clearAllMocks();
  });

  it('should return default settings when table is empty', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [] });
    const settings = await store.get();
    expect(settings.locale).toBe(DEFAULT_SETTINGS.locale);
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it('should return stored settings', async () => {
    const stored = { ...DEFAULT_SETTINGS, locale: 'en' as const, theme: 'dark' as const };
    mockedSql.mockResolvedValueOnce({ rows: [{ value: stored }] });
    const settings = await store.get();
    expect(settings.locale).toBe('en');
    expect(settings.theme).toBe('dark');
  });

  it('should patch settings', async () => {
    // get() call
    mockedSql.mockResolvedValueOnce({ rows: [{ value: DEFAULT_SETTINGS }] });
    // upsert call
    mockedSql.mockResolvedValueOnce({ rows: [] });

    const updated = await store.patch({ locale: 'en' });
    expect(updated.locale).toBe('en');
  });
});
