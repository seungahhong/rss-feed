import { nanoid } from 'nanoid';
import { BaseStore } from './base-store';
import type { Feed, FeedsData } from '@/types';

interface AddFeedInput {
  url: string;
  name: string;
  category: string;
}

type UpdateFeedInput = Partial<Pick<Feed, 'name' | 'url' | 'category' | 'active' | 'lastFetchedAt' | 'lastFetchStatus' | 'lastEtag' | 'lastModified' | 'snapshotAt'>>;

export class FeedStore {
  private store: BaseStore<FeedsData>;

  constructor(filePath: string) {
    this.store = new BaseStore<FeedsData>(filePath, { feeds: [] });
  }

  async getAll(): Promise<Feed[]> {
    const data = await this.store.read();
    return data.feeds;
  }

  async getById(id: string): Promise<Feed | null> {
    const data = await this.store.read();
    return data.feeds.find((f) => f.id === id) ?? null;
  }

  async add(input: AddFeedInput): Promise<Feed> {
    const feed: Feed = {
      id: nanoid(),
      url: input.url,
      name: input.name,
      category: input.category,
      active: true,
      lastFetchedAt: null,
      lastFetchStatus: null,
      lastEtag: null,
      lastModified: null,
      snapshotAt: null,
      createdAt: new Date().toISOString(),
    };
    await this.store.update((data) => {
      data.feeds.push(feed);
      return data;
    });
    return feed;
  }

  async delete(id: string): Promise<boolean> {
    let found = false;
    await this.store.update((data) => {
      const idx = data.feeds.findIndex((f) => f.id === id);
      if (idx !== -1) {
        data.feeds.splice(idx, 1);
        found = true;
      }
      return data;
    });
    return found;
  }

  async updateFeed(id: string, input: UpdateFeedInput): Promise<Feed | null> {
    let updated: Feed | null = null;
    await this.store.update((data) => {
      const feed = data.feeds.find((f) => f.id === id);
      if (feed) {
        Object.assign(feed, input);
        updated = { ...feed };
      }
      return data;
    });
    return updated;
  }
}
