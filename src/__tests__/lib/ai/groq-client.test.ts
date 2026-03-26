import { isGroqAvailable } from '@/lib/ai/groq-client';

describe('groq-client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return false when GROQ_API_KEY is not set', () => {
    delete process.env.GROQ_API_KEY;
    expect(isGroqAvailable()).toBe(false);
  });

  it('should return true when GROQ_API_KEY is set', () => {
    process.env.GROQ_API_KEY = 'test-key';
    expect(isGroqAvailable()).toBe(true);
  });
});
