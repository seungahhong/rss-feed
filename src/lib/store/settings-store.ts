import { sql } from '@vercel/postgres';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

const SETTINGS_KEY = 'app_settings';

export class SettingsStore {
  async get(): Promise<Settings> {
    try {
      const { rows } = await sql`SELECT value FROM settings WHERE key = ${SETTINGS_KEY}`;
      if (rows.length > 0) {
        return { ...DEFAULT_SETTINGS, ...(rows[0].value as Partial<Settings>) };
      }
    } catch {
      // Table may not exist yet, return defaults
    }
    return { ...DEFAULT_SETTINGS };
  }

  async patch(partial: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const updated = { ...current, ...partial };

    await sql`
      INSERT INTO settings (key, value)
      VALUES (${SETTINGS_KEY}, ${JSON.stringify(updated)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(updated)}::jsonb
    `;
    return updated;
  }
}
