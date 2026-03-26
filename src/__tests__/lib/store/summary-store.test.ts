import { SummaryStore } from '@/lib/store/summary-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('SummaryStore', () => {
  let tmpDir: string;
  let store: SummaryStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'summary-store-test-'));
    store = new SummaryStore(path.join(tmpDir, 'summaries.json'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should return empty summaries initially', async () => {
    const summaries = await store.getAll();
    expect(summaries).toEqual([]);
  });

  it('should add a summary', async () => {
    const summary = await store.add({
      articleId: 'article-1',
      lang: 'ko',
      title: 'AI 요약 제목',
      description: '요약 내용입니다.',
      model: 'llama3',
    });
    expect(summary.id).toBeDefined();
    expect(summary.status).toBe('summarized');
    expect(summary.generatedAt).toBeDefined();
  });

  it('should get summaries by articleId', async () => {
    await store.add({ articleId: 'a1', lang: 'ko', title: 'T1', description: 'D1', model: 'llama3' });
    await store.add({ articleId: 'a1', lang: 'en', title: 'T1-en', description: 'D1-en', model: 'llama3' });
    await store.add({ articleId: 'a2', lang: 'ko', title: 'T2', description: 'D2', model: 'llama3' });
    const summaries = await store.getByArticleId('a1');
    expect(summaries).toHaveLength(2);
  });

  it('should get summary by articleId and lang', async () => {
    await store.add({ articleId: 'a1', lang: 'ko', title: 'Korean', description: 'D', model: 'llama3' });
    await store.add({ articleId: 'a1', lang: 'en', title: 'English', description: 'D', model: 'llama3' });
    const summary = await store.getByArticleAndLang('a1', 'en');
    expect(summary?.title).toBe('English');
  });

  it('should delete summaries by articleId', async () => {
    await store.add({ articleId: 'a1', lang: 'ko', title: 'T', description: 'D', model: 'llama3' });
    await store.add({ articleId: 'a1', lang: 'en', title: 'T', description: 'D', model: 'llama3' });
    const count = await store.deleteByArticleId('a1');
    expect(count).toBe(2);
    const all = await store.getAll();
    expect(all).toHaveLength(0);
  });

  it('should search summaries by title or description', async () => {
    await store.add({ articleId: 'a1', lang: 'ko', title: 'React Hooks 가이드', description: '훅에 대해 알아봅니다', model: 'llama3' });
    await store.add({ articleId: 'a2', lang: 'ko', title: 'Vue 가이드', description: 'Vue 3 기능', model: 'llama3' });
    const results = await store.search('hooks');
    expect(results).toHaveLength(1);
  });
});
