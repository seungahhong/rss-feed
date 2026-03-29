import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type { Summary, SupportedLocale } from '@/types';

interface AddSummaryInput {
  articleId: string;
  lang: SupportedLocale;
  title: string;
  description: string;
  model: string;
}

function rowToSummary(row: Record<string, unknown>): Summary {
  return {
    id: row.id as string,
    articleId: row.article_id as string,
    lang: row.lang as SupportedLocale,
    title: row.title as string,
    description: row.description as string,
    generatedAt: (row.generated_at as Date).toISOString(),
    model: row.model as string,
    status: row.status as Summary['status'],
  };
}

export class SummaryStore {
  async getAll(): Promise<Summary[]> {
    const { rows } = await sql`SELECT * FROM summaries ORDER BY generated_at DESC`;
    return rows.map(rowToSummary);
  }

  async getByArticleId(articleId: string): Promise<Summary[]> {
    const { rows } = await sql`SELECT * FROM summaries WHERE article_id = ${articleId}`;
    return rows.map(rowToSummary);
  }

  async getByArticleAndLang(articleId: string, lang: SupportedLocale): Promise<Summary | null> {
    const { rows } = await sql`
      SELECT * FROM summaries WHERE article_id = ${articleId} AND lang = ${lang} LIMIT 1
    `;
    return rows.length > 0 ? rowToSummary(rows[0]) : null;
  }

  async add(input: AddSummaryInput): Promise<Summary> {
    const id = nanoid();
    const now = new Date().toISOString();

    const { rows } = await sql`
      INSERT INTO summaries (id, article_id, lang, title, description, generated_at, model, status)
      VALUES (${id}, ${input.articleId}, ${input.lang}, ${input.title}, ${input.description}, ${now}, ${input.model}, 'summarized')
      RETURNING *
    `;
    return rowToSummary(rows[0]);
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    const { rowCount } = await sql`DELETE FROM summaries WHERE article_id = ${articleId}`;
    return rowCount ?? 0;
  }

  async search(query: string): Promise<Summary[]> {
    const q = `%${query}%`;
    const { rows } = await sql`
      SELECT * FROM summaries
      WHERE LOWER(title) LIKE LOWER(${q})
         OR LOWER(description) LIKE LOWER(${q})
      ORDER BY generated_at DESC
      LIMIT 100
    `;
    return rows.map(rowToSummary);
  }
}
