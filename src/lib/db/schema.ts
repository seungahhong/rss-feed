import { sql } from '@vercel/postgres';

export async function initializeDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS feeds (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true,
      last_fetched_at TIMESTAMPTZ,
      last_fetch_status TEXT,
      last_etag TEXT,
      last_modified TEXT,
      snapshot_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
      guid TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      content_snippet TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      published_at TIMESTAMPTZ,
      content_hash TEXT NOT NULL DEFAULT '',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      topic TEXT NOT NULL DEFAULT 'Uncategorized'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_guid ON articles(guid)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      lang TEXT NOT NULL DEFAULT 'ko',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      model TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'summarized'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_summaries_article_id ON summaries(article_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      label_ko TEXT NOT NULL DEFAULT '',
      label_en TEXT NOT NULL DEFAULT '',
      is_seed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
}
