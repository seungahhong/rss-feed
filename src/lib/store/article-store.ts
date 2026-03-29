import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type { Article } from '@/types';

type AddArticleInput = Omit<Article, 'id' | 'fetchedAt'>;
type UpdateArticleInput = Partial<Pick<Article, 'title' | 'content' | 'contentSnippet' | 'contentHash' | 'topic'>>;

interface PaginatedResult {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}

function rowToArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    feedId: row.feed_id as string,
    guid: row.guid as string,
    title: row.title as string,
    link: row.link as string,
    content: row.content as string,
    contentSnippet: row.content_snippet as string,
    author: row.author as string,
    publishedAt: row.published_at ? (row.published_at as Date).toISOString() : '',
    contentHash: row.content_hash as string,
    fetchedAt: (row.fetched_at as Date).toISOString(),
    topic: (row.topic as string) || 'Uncategorized',
  };
}

export class ArticleStore {
  async getAll(): Promise<Article[]> {
    const { rows } = await sql`SELECT * FROM articles ORDER BY published_at DESC`;
    return rows.map(rowToArticle);
  }

  async getById(id: string): Promise<Article | null> {
    const { rows } = await sql`SELECT * FROM articles WHERE id = ${id}`;
    return rows.length > 0 ? rowToArticle(rows[0]) : null;
  }

  async findByGuid(guid: string): Promise<Article | null> {
    const { rows } = await sql`SELECT * FROM articles WHERE guid = ${guid} LIMIT 1`;
    return rows.length > 0 ? rowToArticle(rows[0]) : null;
  }

  async getByFeedId(feedId: string): Promise<Article[]> {
    const { rows } = await sql`SELECT * FROM articles WHERE feed_id = ${feedId} ORDER BY published_at DESC`;
    return rows.map(rowToArticle);
  }

  async add(input: AddArticleInput): Promise<Article> {
    const id = nanoid();
    const now = new Date().toISOString();
    const topic = input.topic || 'Uncategorized';
    const publishedAt = input.publishedAt || null;

    const { rows } = await sql`
      INSERT INTO articles (id, feed_id, guid, title, link, content, content_snippet, author, published_at, content_hash, fetched_at, topic)
      VALUES (${id}, ${input.feedId}, ${input.guid}, ${input.title}, ${input.link}, ${input.content}, ${input.contentSnippet}, ${input.author}, ${publishedAt}, ${input.contentHash}, ${now}, ${topic})
      RETURNING *
    `;
    return rowToArticle(rows[0]);
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<Article | null> {
    const article = await this.getById(id);
    if (!article) return null;

    const title = input.title ?? article.title;
    const content = input.content ?? article.content;
    const contentSnippet = input.contentSnippet ?? article.contentSnippet;
    const contentHash = input.contentHash ?? article.contentHash;
    const topic = input.topic ?? article.topic;

    const { rows } = await sql`
      UPDATE articles SET
        title = ${title},
        content = ${content},
        content_snippet = ${contentSnippet},
        content_hash = ${contentHash},
        topic = ${topic}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows.length > 0 ? rowToArticle(rows[0]) : null;
  }

  async deleteByFeedId(feedId: string): Promise<number> {
    const { rowCount } = await sql`DELETE FROM articles WHERE feed_id = ${feedId}`;
    return rowCount ?? 0;
  }

  async search(query: string): Promise<Article[]> {
    const q = `%${query}%`;
    const { rows } = await sql`
      SELECT * FROM articles
      WHERE LOWER(title) LIKE LOWER(${q})
         OR LOWER(content_snippet) LIKE LOWER(${q})
      ORDER BY published_at DESC
      LIMIT 100
    `;
    return rows.map(rowToArticle);
  }

  async getPage(page: number, limit: number, feedId?: string): Promise<PaginatedResult> {
    const offset = (page - 1) * limit;

    if (feedId) {
      const countResult = await sql`SELECT COUNT(*) as count FROM articles WHERE feed_id = ${feedId}`;
      const total = parseInt(countResult.rows[0].count as string, 10);
      const { rows } = await sql`
        SELECT * FROM articles WHERE feed_id = ${feedId}
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return {
        articles: rows.map(rowToArticle),
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    const countResult = await sql`SELECT COUNT(*) as count FROM articles`;
    const total = parseInt(countResult.rows[0].count as string, 10);
    const { rows } = await sql`
      SELECT * FROM articles
      ORDER BY published_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return {
      articles: rows.map(rowToArticle),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getByTopic(topic: string): Promise<Article[]> {
    const { rows } = await sql`
      SELECT * FROM articles WHERE topic = ${topic}
      ORDER BY published_at DESC
    `;
    return rows.map(rowToArticle);
  }

  async getYears(): Promise<number[]> {
    const { rows } = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM published_at)::int AS year
      FROM articles
      WHERE published_at IS NOT NULL
      ORDER BY year DESC
    `;
    return rows.map((r) => r.year as number);
  }

  async getRecentArticles(days: number, limit: number): Promise<Article[]> {
    const { rows } = await sql`
      SELECT * FROM articles
      WHERE published_at >= NOW() - INTERVAL '1 day' * ${days}
      ORDER BY published_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToArticle);
  }

  async getPageByTopicAndYear(
    page: number,
    limit: number,
    options?: { topic?: string; year?: number; feedId?: string },
  ): Promise<PaginatedResult> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];

    let paramIdx = 1;
    if (options?.feedId) {
      conditions.push(`feed_id = $${paramIdx++}`);
      values.push(options.feedId);
    }
    if (options?.topic) {
      conditions.push(`topic = $${paramIdx++}`);
      values.push(options.topic);
    }
    if (options?.year) {
      conditions.push(`EXTRACT(YEAR FROM published_at) = $${paramIdx++}`);
      values.push(options.year);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Use raw query for dynamic WHERE clause
    const countQuery = `SELECT COUNT(*) as count FROM articles ${where}`;
    const dataQuery = `SELECT * FROM articles ${where} ORDER BY published_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    values.push(limit, offset);

    const countResult = await sql.query(countQuery, values.slice(0, conditions.length));
    const total = parseInt(countResult.rows[0].count as string, 10);

    const dataResult = await sql.query(dataQuery, values);
    return {
      articles: dataResult.rows.map(rowToArticle),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
