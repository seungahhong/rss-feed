import { nanoid } from 'nanoid';
import { BaseStore } from './base-store';
import type { Topic, TopicsData } from '@/types';

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

export class TopicStore {
  private store: BaseStore<TopicsData>;

  constructor(filePath: string) {
    this.store = new BaseStore<TopicsData>(filePath, { topics: [] });
  }

  async getAll(): Promise<Topic[]> {
    const data = await this.store.read();
    return data.topics;
  }

  async getByName(name: string): Promise<Topic | null> {
    const data = await this.store.read();
    const normalized = normalizeName(name);
    return data.topics.find((t) => normalizeName(t.name) === normalized) ?? null;
  }

  async add(input: AddTopicInput): Promise<Topic> {
    const existing = await this.getByName(input.name);
    if (existing) return existing;

    const topic: Topic = {
      id: nanoid(),
      name: input.name,
      label: input.label,
      isSeed: input.isSeed ?? false,
      createdAt: new Date().toISOString(),
    };
    await this.store.update((data) => {
      data.topics.push(topic);
      return data;
    });
    return topic;
  }

  async ensureSeedTopics(): Promise<void> {
    const data = await this.store.read();
    if (data.topics.length > 0) return;

    const topics: Topic[] = SEED_TOPICS.map((input) => ({
      id: nanoid(),
      name: input.name,
      label: input.label,
      isSeed: true,
      createdAt: new Date().toISOString(),
    }));
    await this.store.write({ topics });
  }

  async getNames(): Promise<string[]> {
    const data = await this.store.read();
    return data.topics.map((t) => t.name);
  }
}
