import { parseRssFeed } from '@/lib/rss/parser';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <link>https://example.com</link>
    <description>A test blog</description>
    <item>
      <title>First Post</title>
      <link>https://example.com/first</link>
      <guid>guid-1</guid>
      <pubDate>Mon, 18 Mar 2026 00:00:00 GMT</pubDate>
      <description>&lt;p&gt;Hello &lt;strong&gt;world&lt;/strong&gt;&lt;/p&gt;</description>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://example.com/second</link>
      <guid>guid-2</guid>
      <pubDate>Tue, 19 Mar 2026 00:00:00 GMT</pubDate>
      <description>Plain text content</description>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Blog</title>
  <link href="https://atom.example.com"/>
  <entry>
    <title>Atom Entry</title>
    <link href="https://atom.example.com/entry-1"/>
    <id>atom-guid-1</id>
    <updated>2026-03-18T00:00:00Z</updated>
    <content type="html">&lt;p&gt;Atom content&lt;/p&gt;</content>
  </entry>
</feed>`;

describe('parseRssFeed', () => {
  it('should parse RSS 2.0 feed', async () => {
    const result = await parseRssFeed(SAMPLE_RSS);
    expect(result.title).toBe('Test Blog');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].guid).toBe('guid-1');
    expect(result.items[0].title).toBe('First Post');
    expect(result.items[0].link).toBe('https://example.com/first');
  });

  it('should strip HTML from content and provide snippet', async () => {
    const result = await parseRssFeed(SAMPLE_RSS);
    expect(result.items[0].contentSnippet).not.toContain('<p>');
    expect(result.items[0].contentSnippet).not.toContain('<strong>');
    expect(result.items[0].contentSnippet).toContain('Hello');
    expect(result.items[0].contentSnippet).toContain('world');
  });

  it('should preserve original HTML content', async () => {
    const result = await parseRssFeed(SAMPLE_RSS);
    expect(result.items[0].content).toContain('<p>');
  });

  it('should parse Atom feed', async () => {
    const result = await parseRssFeed(SAMPLE_ATOM);
    expect(result.title).toBe('Atom Blog');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].guid).toBe('atom-guid-1');
  });

  it('should generate contentHash for each item', async () => {
    const result = await parseRssFeed(SAMPLE_RSS);
    expect(result.items[0].contentHash).toBeDefined();
    expect(result.items[0].contentHash.length).toBeGreaterThan(0);
  });

  it('should use link as guid fallback', async () => {
    const feedWithoutGuid = `<?xml version="1.0"?>
    <rss version="2.0"><channel><title>T</title>
    <item><title>No GUID</title><link>https://example.com/no-guid</link><description>text</description></item>
    </channel></rss>`;
    const result = await parseRssFeed(feedWithoutGuid);
    expect(result.items[0].guid).toBe('https://example.com/no-guid');
  });
});
