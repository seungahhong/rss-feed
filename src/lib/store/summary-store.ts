import { nanoid } from 'nanoid';
import { BaseStore } from './base-store';
import type { Summary, SummariesData, SupportedLocale } from '@/types';

interface AddSummaryInput {
  articleId: string;
  lang: SupportedLocale;
  title: string;
  description: string;
  model: string;
}

export class SummaryStore {
  private store: BaseStore<SummariesData>;

  constructor(filePath: string) {
    this.store = new BaseStore<SummariesData>(filePath, { summaries: [] });
  }

  async getAll(): Promise<Summary[]> {
    const data = await this.store.read();
    return data.summaries;
  }

  async getByArticleId(articleId: string): Promise<Summary[]> {
    const data = await this.store.read();
    return data.summaries.filter((s) => s.articleId === articleId);
  }

  async getByArticleAndLang(articleId: string, lang: SupportedLocale): Promise<Summary | null> {
    const data = await this.store.read();
    return data.summaries.find((s) => s.articleId === articleId && s.lang === lang) ?? null;
  }

  async add(input: AddSummaryInput): Promise<Summary> {
    const summary: Summary = {
      id: nanoid(),
      articleId: input.articleId,
      lang: input.lang,
      title: input.title,
      description: input.description,
      generatedAt: new Date().toISOString(),
      model: input.model,
      status: 'summarized',
    };
    await this.store.update((data) => {
      data.summaries.push(summary);
      return data;
    });
    return summary;
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    let count = 0;
    await this.store.update((data) => {
      const before = data.summaries.length;
      data.summaries = data.summaries.filter((s) => s.articleId !== articleId);
      count = before - data.summaries.length;
      return data;
    });
    return count;
  }

  async search(query: string): Promise<Summary[]> {
    const data = await this.store.read();
    const q = query.toLowerCase();
    return data.summaries.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  }
}
