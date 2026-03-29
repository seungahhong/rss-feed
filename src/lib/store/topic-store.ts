import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type { Topic } from '@/types';

interface AddTopicInput {
  name: string;
  label: { ko: string; en: string };
  isSeed?: boolean;
}

export const SEED_TOPICS: AddTopicInput[] = [
  { name: 'AI/ML', label: { ko: 'AI/ML', en: 'AI/ML' }, isSeed: true },
  { name: 'Frontend', label: { ko: '프론트엔드', en: 'Frontend' }, isSeed: true },
  { name: 'Backend', label: { ko: '백엔드', en: 'Backend' }, isSeed: true },
  { name: 'DevOps', label: { ko: 'DevOps', en: 'DevOps' }, isSeed: true },
  { name: 'Security', label: { ko: '보안', en: 'Security' }, isSeed: true },
  { name: 'Database', label: { ko: '데이터베이스', en: 'Database' }, isSeed: true },
  { name: 'Mobile', label: { ko: '모바일', en: 'Mobile' }, isSeed: true },
  { name: 'Cloud', label: { ko: '클라우드', en: 'Cloud' }, isSeed: true },
  { name: 'Programming Languages', label: { ko: '프로그래밍 언어', en: 'Programming Languages' }, isSeed: true },
  { name: 'Open Source', label: { ko: '오픈소스', en: 'Open Source' }, isSeed: true },
  { name: 'Product/Design', label: { ko: '제품/디자인', en: 'Product/Design' }, isSeed: true },
  { name: 'Career/Culture', label: { ko: '커리어/문화', en: 'Career/Culture' }, isSeed: true },
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function rowToTopic(row: Record<string, unknown>): Topic {
  return {
    id: row.id as string,
    name: row.name as string,
    label: {
      ko: row.label_ko as string,
      en: row.label_en as string,
    },
    isSeed: row.is_seed as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export class TopicStore {
  async getAll(): Promise<Topic[]> {
    const { rows } = await sql`SELECT * FROM topics ORDER BY is_seed DESC, name ASC`;
    return rows.map(rowToTopic);
  }

  async getByName(name: string): Promise<Topic | null> {
    const normalized = normalizeName(name);
    const { rows } = await sql`SELECT * FROM topics WHERE LOWER(TRIM(name)) = ${normalized} LIMIT 1`;
    return rows.length > 0 ? rowToTopic(rows[0]) : null;
  }

  async add(input: AddTopicInput): Promise<Topic> {
    const existing = await this.getByName(input.name);
    if (existing) return existing;

    const id = nanoid();
    const now = new Date().toISOString();
    const isSeed = input.isSeed ?? false;

    const { rows } = await sql`
      INSERT INTO topics (id, name, label_ko, label_en, is_seed, created_at)
      VALUES (${id}, ${input.name}, ${input.label.ko}, ${input.label.en}, ${isSeed}, ${now})
      ON CONFLICT (name) DO NOTHING
      RETURNING *
    `;

    if (rows.length > 0) return rowToTopic(rows[0]);

    // If ON CONFLICT hit, return existing
    const found = await this.getByName(input.name);
    return found!;
  }

  async ensureSeedTopics(): Promise<void> {
    const { rows } = await sql`SELECT COUNT(*) as count FROM topics`;
    const count = parseInt(rows[0].count as string, 10);
    if (count > 0) return;

    for (const input of SEED_TOPICS) {
      const id = nanoid();
      const now = new Date().toISOString();
      await sql`
        INSERT INTO topics (id, name, label_ko, label_en, is_seed, created_at)
        VALUES (${id}, ${input.name}, ${input.label.ko}, ${input.label.en}, true, ${now})
        ON CONFLICT (name) DO NOTHING
      `;
    }
  }

  async getNames(): Promise<string[]> {
    const { rows } = await sql`SELECT name FROM topics ORDER BY name`;
    return rows.map((r) => r.name as string);
  }
}
