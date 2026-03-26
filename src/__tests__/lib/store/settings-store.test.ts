import { SettingsStore } from '@/lib/store/settings-store';
import { DEFAULT_SETTINGS } from '@/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('SettingsStore', () => {
  let tmpDir: string;
  let store: SettingsStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-store-test-'));
    store = new SettingsStore(path.join(tmpDir, 'settings.json'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should return default settings initially', async () => {
    const settings = await store.get();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should update polling settings', async () => {
    const updated = await store.patch({
      polling: { ...DEFAULT_SETTINGS.polling, enabled: false, type: 'hourly', intervalHours: 2 },
    });
    expect(updated.polling.enabled).toBe(false);
    expect(updated.polling.type).toBe('hourly');
    expect(updated.polling.intervalHours).toBe(2);
    expect(updated.ai).toEqual(DEFAULT_SETTINGS.ai);
  });

  it('should update AI settings', async () => {
    const updated = await store.patch({ ai: { ollamaUrl: 'http://localhost:11434', model: 'mistral' } });
    expect(updated.ai.model).toBe('mistral');
    expect(updated.polling).toEqual(DEFAULT_SETTINGS.polling);
  });

  it('should update locale', async () => {
    const updated = await store.patch({ locale: 'en' });
    expect(updated.locale).toBe('en');
  });

  it('should update theme', async () => {
    const updated = await store.patch({ theme: 'dark' });
    expect(updated.theme).toBe('dark');
  });

  it('should persist settings across reads', async () => {
    await store.patch({ locale: 'en', theme: 'dark' });
    const freshStore = new SettingsStore(path.join(tmpDir, 'settings.json'));
    const settings = await freshStore.get();
    expect(settings.locale).toBe('en');
    expect(settings.theme).toBe('dark');
  });
});
