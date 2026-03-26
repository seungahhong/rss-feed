import { BaseStore } from './base-store';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export class SettingsStore {
  private store: BaseStore<Settings>;

  constructor(filePath: string) {
    this.store = new BaseStore<Settings>(filePath, DEFAULT_SETTINGS);
  }

  async get(): Promise<Settings> {
    return this.store.read();
  }

  async patch(partial: Partial<Settings>): Promise<Settings> {
    return this.store.update((settings) => {
      return { ...settings, ...partial };
    });
  }
}
