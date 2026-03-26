import { parseSummaryResponse } from '@/lib/ai/summarizer';

describe('parseSummaryResponse', () => {
  it('should parse valid JSON response', () => {
    const response = JSON.stringify({
      title: 'React Server Components 이해하기',
      description: '서버 컴포넌트의 핵심 개념을 설명합니다.',
    });
    const result = parseSummaryResponse(response);
    expect(result.title).toBe('React Server Components 이해하기');
    expect(result.description).toBe('서버 컴포넌트의 핵심 개념을 설명합니다.');
  });

  it('should extract JSON from markdown code block', () => {
    const response = `Here is the summary:\n\`\`\`json\n{"title": "제목", "description": "설명"}\n\`\`\``;
    const result = parseSummaryResponse(response);
    expect(result.title).toBe('제목');
    expect(result.description).toBe('설명');
  });

  it('should extract JSON embedded in text', () => {
    const response = `Some preamble text\n{"title": "제목", "description": "설명"}\nSome trailing text`;
    const result = parseSummaryResponse(response);
    expect(result.title).toBe('제목');
    expect(result.description).toBe('설명');
  });

  it('should throw on invalid response', () => {
    expect(() => parseSummaryResponse('no json here')).toThrow();
  });

  it('should throw when title is missing', () => {
    const response = JSON.stringify({ description: 'only desc' });
    expect(() => parseSummaryResponse(response)).toThrow();
  });

  it('should throw when description is missing', () => {
    const response = JSON.stringify({ title: 'only title' });
    expect(() => parseSummaryResponse(response)).toThrow();
  });
});
