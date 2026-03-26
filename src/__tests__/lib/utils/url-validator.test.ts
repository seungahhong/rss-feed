import { isValidRssUrl, isPrivateUrl } from '@/lib/utils/url-validator';

describe('URL Validator', () => {
  describe('isPrivateUrl', () => {
    it('should detect localhost', () => {
      expect(isPrivateUrl('http://localhost:3000/rss')).toBe(true);
    });
    it('should detect 127.0.0.1', () => {
      expect(isPrivateUrl('http://127.0.0.1/rss')).toBe(true);
    });
    it('should detect 10.x.x.x', () => {
      expect(isPrivateUrl('http://10.0.0.1/rss')).toBe(true);
    });
    it('should detect 192.168.x.x', () => {
      expect(isPrivateUrl('http://192.168.1.1/rss')).toBe(true);
    });
    it('should detect 172.16-31.x.x', () => {
      expect(isPrivateUrl('http://172.16.0.1/rss')).toBe(true);
    });
    it('should allow public URLs', () => {
      expect(isPrivateUrl('https://example.com/rss')).toBe(false);
    });
  });

  describe('isValidRssUrl', () => {
    it('should accept valid HTTPS URL', () => {
      expect(isValidRssUrl('https://example.com/rss')).toEqual({ valid: true });
    });
    it('should reject FTP URLs', () => {
      const result = isValidRssUrl('ftp://example.com/rss');
      expect(result.valid).toBe(false);
    });
    it('should reject private URLs', () => {
      const result = isValidRssUrl('http://192.168.1.1/rss');
      expect(result.valid).toBe(false);
    });
    it('should reject invalid URLs', () => {
      const result = isValidRssUrl('not-a-url');
      expect(result.valid).toBe(false);
    });
  });
});
