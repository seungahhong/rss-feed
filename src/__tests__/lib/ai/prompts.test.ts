import { buildSummaryPrompt } from '@/lib/ai/prompts';

describe('buildSummaryPrompt', () => {
  const article = {
    title: 'Understanding React Server Components',
    content: 'React Server Components allow you to render components on the server...',
  };

  it('should build Korean summary prompt', () => {
    const prompt = buildSummaryPrompt(article.title, article.content, 'ko');
    expect(prompt).toContain(article.title);
    expect(prompt).toContain(article.content);
    expect(prompt).toContain('한국어');
  });

  it('should build English summary prompt', () => {
    const prompt = buildSummaryPrompt(article.title, article.content, 'en');
    expect(prompt).toContain(article.title);
    expect(prompt).toContain('English');
  });

  it('should instruct title to be 1-2 lines', () => {
    const prompt = buildSummaryPrompt(article.title, article.content, 'ko');
    expect(prompt).toMatch(/1-2/);
  });

  it('should instruct description to be 10 lines or less', () => {
    const prompt = buildSummaryPrompt(article.title, article.content, 'ko');
    expect(prompt).toMatch(/10/);
  });

  it('should request JSON output format', () => {
    const prompt = buildSummaryPrompt(article.title, article.content, 'ko');
    expect(prompt).toContain('JSON');
  });
});
