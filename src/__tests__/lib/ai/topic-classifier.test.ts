import {
  buildTopicClassificationPrompt,
  parseClassificationResponse,
} from '@/lib/ai/topic-classifier';

describe('topic-classifier', () => {
  describe('buildTopicClassificationPrompt', () => {
    it('should include existing topics and articles', () => {
      const prompt = buildTopicClassificationPrompt(
        [{ title: 'React 19 Guide', contentSnippet: 'New features in React 19' }],
        ['AI/ML', 'Frontend', 'Backend'],
      );
      expect(prompt).toContain('AI/ML, Frontend, Backend');
      expect(prompt).toContain('React 19 Guide');
      expect(prompt).toContain('New features in React 19');
    });

    it('should truncate long snippets to 200 chars', () => {
      const longSnippet = 'a'.repeat(500);
      const prompt = buildTopicClassificationPrompt(
        [{ title: 'Test', contentSnippet: longSnippet }],
        ['AI/ML'],
      );
      expect(prompt).not.toContain('a'.repeat(500));
      expect(prompt).toContain('a'.repeat(200));
    });

    it('should number multiple articles', () => {
      const prompt = buildTopicClassificationPrompt(
        [
          { title: 'Article 1', contentSnippet: 'Snippet 1' },
          { title: 'Article 2', contentSnippet: 'Snippet 2' },
        ],
        ['AI/ML'],
      );
      expect(prompt).toContain('[1]');
      expect(prompt).toContain('[2]');
    });
  });

  describe('parseClassificationResponse', () => {
    it('should parse direct JSON array', () => {
      const result = parseClassificationResponse(
        '[{"title": "React Guide", "topic": "Frontend"}]',
      );
      expect(result).toEqual([{ title: 'React Guide', topic: 'Frontend' }]);
    });

    it('should parse JSON from markdown code block', () => {
      const result = parseClassificationResponse(
        '```json\n[{"title": "Test", "topic": "AI/ML"}]\n```',
      );
      expect(result).toEqual([{ title: 'Test', topic: 'AI/ML' }]);
    });

    it('should extract JSON array from surrounding text', () => {
      const result = parseClassificationResponse(
        'Here is the result:\n[{"title": "Test", "topic": "Backend"}]\nDone.',
      );
      expect(result).toEqual([{ title: 'Test', topic: 'Backend' }]);
    });

    it('should return empty array for unparseable response', () => {
      const result = parseClassificationResponse('This is not JSON');
      expect(result).toEqual([]);
    });

    it('should handle multiple articles', () => {
      const result = parseClassificationResponse(
        JSON.stringify([
          { title: 'A1', topic: 'AI/ML' },
          { title: 'A2', topic: 'Frontend' },
        ]),
      );
      expect(result).toHaveLength(2);
    });
  });
});
