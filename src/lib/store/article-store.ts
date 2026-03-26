import { nanoid } from 'nanoid';
import { BaseStore } from './base-store';
import type { Article, ArticlesData } from '@/types';

type AddArticleInput = Omit<Article, 'id' | 'fetchedAt'>;
type UpdateArticleInput = Partial<Pick<Article, 'title' | 'content' | 'contentSnippet' | 'contentHash' | 'topic'>>;

interface PaginatedResult {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}

export class ArticleStore {
  private store: BaseStore<ArticlesData>;

  constructor(filePath: string) {
    this.store = new BaseStore<ArticlesData>(filePath, { articles: [] });
  }

  async getAll(): Promise<Article[]> {
    const data = await this.store.read();
    return data.articles;
  }

  async getById(id: string): Promise<Article | null> {
    const data = await this.store.read();
    return data.articles.find((a) => a.id === id) ?? null;
  }

  async findByGuid(guid: string): Promise<Article | null> {
    const data = await this.store.read();
    return data.articles.find((a) => a.guid === guid) ?? null;
  }

  async getByFeedId(feedId: string): Promise<Article[]> {
    const data = await this.store.read();
    return data.articles.filter((a) => a.feedId === feedId);
  }

  async add(input: AddArticleInput): Promise<Article> {
    const article: Article = {
      ...input,
      id: nanoid(),
      fetchedAt: new Date().toISOString(),
    };
    await this.store.update((data) => {
      data.articles.push(article);
      return data;
    });
    return article;
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<Article | null> {
    let updated: Article | null = null;
    await this.store.update((data) => {
      const article = data.articles.find((a) => a.id === id);
      if (article) {
        Object.assign(article, input);
        updated = { ...article };
      }
      return data;
    });
    return updated;
  }

  async deleteByFeedId(feedId: string): Promise<number> {
    let count = 0;
    await this.store.update((data) => {
      const before = data.articles.length;
      data.articles = data.articles.filter((a) => a.feedId !== feedId);
      count = before - data.articles.length;
      return data;
    });
    return count;
  }

  async search(query: string): Promise<Article[]> {
    const data = await this.store.read();
    const q = query.toLowerCase();
    return data.articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.contentSnippet.toLowerCase().includes(q),
    );
  }

  async getPage(page: number, limit: number, feedId?: string): Promise<PaginatedResult> {
    const data = await this.store.read();
    let articles = data.articles;
    if (feedId) {
      articles = articles.filter((a) => a.feedId === feedId);
    }
    const total = articles.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return {
      articles: articles.slice(start, start + limit),
      total,
      page,
      totalPages,
    };
  }

  async getByTopic(topic: string): Promise<Article[]> {
    const data = await this.store.read();
    return data.articles.filter((a) => (a.topic || 'Uncategorized') === topic);
  }

  async getYears(): Promise<number[]> {
    const data = await this.store.read();
    const years = new Set<number>();
    for (const a of data.articles) {
      const date = new Date(a.publishedAt);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  async getPageByTopicAndYear(
    page: number,
    limit: number,
    options?: { topic?: string; year?: number; feedId?: string },
  ): Promise<PaginatedResult> {
    const data = await this.store.read();
    let articles = [...data.articles];

    if (options?.feedId) {
      articles = articles.filter((a) => a.feedId === options.feedId);
    }
    if (options?.topic) {
      articles = articles.filter((a) => (a.topic || 'Uncategorized') === options.topic);
    }
    if (options?.year) {
      articles = articles.filter((a) => {
        const date = new Date(a.publishedAt);
        return !isNaN(date.getTime()) && date.getFullYear() === options.year;
      });
    }

    // 최신순 정렬
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const total = articles.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    return {
      articles: articles.slice(start, start + limit),
      total,
      page,
      totalPages,
    };
  }
}
