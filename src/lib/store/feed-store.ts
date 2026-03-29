import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type { Feed } from '@/types';

interface AddFeedInput {
  url: string;
  name: string;
  category: string;
}

type UpdateFeedInput = Partial<Pick<Feed, 'name' | 'url' | 'category' | 'active' | 'lastFetchedAt' | 'lastFetchStatus' | 'lastEtag' | 'lastModified' | 'snapshotAt'>>;

function rowToFeed(row: Record<string, unknown>): Feed {
  return {
    id: row.id as string,
    url: row.url as string,
    name: row.name as string,
    category: row.category as string,
    active: row.active as boolean,
    lastFetchedAt: row.last_fetched_at ? (row.last_fetched_at as Date).toISOString() : null,
    lastFetchStatus: (row.last_fetch_status as Feed['lastFetchStatus']) ?? null,
    lastEtag: (row.last_etag as string) ?? null,
    lastModified: (row.last_modified as string) ?? null,
    snapshotAt: row.snapshot_at ? (row.snapshot_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export class FeedStore {
  async getAll(): Promise<Feed[]> {
    const { rows } = await sql`SELECT * FROM feeds ORDER BY created_at DESC`;
    return rows.map(rowToFeed);
  }

  async getById(id: string): Promise<Feed | null> {
    const { rows } = await sql`SELECT * FROM feeds WHERE id = ${id}`;
    return rows.length > 0 ? rowToFeed(rows[0]) : null;
  }

  async add(input: AddFeedInput): Promise<Feed> {
    const id = nanoid();
    const now = new Date().toISOString();
    const { rows } = await sql`
      INSERT INTO feeds (id, url, name, category, active, created_at)
      VALUES (${id}, ${input.url}, ${input.name}, ${input.category}, true, ${now})
      RETURNING *
    `;
    return rowToFeed(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await sql`DELETE FROM feeds WHERE id = ${id}`;
    return (rowCount ?? 0) > 0;
  }

  async updateFeed(id: string, input: UpdateFeedInput): Promise<Feed | null> {
    const feed = await this.getById(id);
    if (!feed) return null;

    const name = input.name ?? feed.name;
    const url = input.url ?? feed.url;
    const category = input.category ?? feed.category;
    const active = input.active ?? feed.active;
    const lastFetchedAt = input.lastFetchedAt ?? feed.lastFetchedAt;
    const lastFetchStatus = input.lastFetchStatus ?? feed.lastFetchStatus;
    const lastEtag = input.lastEtag ?? feed.lastEtag;
    const lastModified = input.lastModified ?? feed.lastModified;
    const snapshotAt = input.snapshotAt ?? feed.snapshotAt;

    const { rows } = await sql`
      UPDATE feeds SET
        name = ${name},
        url = ${url},
        category = ${category},
        active = ${active},
        last_fetched_at = ${lastFetchedAt},
        last_fetch_status = ${lastFetchStatus},
        last_etag = ${lastEtag},
        last_modified = ${lastModified},
        snapshot_at = ${snapshotAt}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows.length > 0 ? rowToFeed(rows[0]) : null;
  }
}
