import { TopicStore } from '@/lib/store/topic-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('TopicStore', () => {
  let tmpDir: string;
  let store: TopicStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'topic-store-test-'));
    store = new TopicStore(path.join(tmpDir, 'topics.json'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should return empty topics initially', async () => {
    const topics = await store.getAll();
    expect(topics).toEqual([]);
  });

  it('should add a topic', async () => {
    const topic = await store.add({
      name: 'AI/ML',
      label: { ko: 'AI/ML', en: 'AI/ML' },
    });
    expect(topic.id).toBeDefined();
    expect(topic.name).toBe('AI/ML');
    expect(topic.isSeed).toBe(false);
  });

  it('should not create duplicate topics (case-insensitive)', async () => {
    await store.add({ name: 'Frontend', label: { ko: '프론트엔드', en: 'Frontend' } });
    const dup = await store.add({ name: 'frontend', label: { ko: '프론트엔드', en: 'Frontend' } });
    const all = await store.getAll();
    expect(all).toHaveLength(1);
    expect(dup.name).toBe('Frontend');
  });

  it('should find topic by name case-insensitively', async () => {
    await store.add({ name: 'DevOps', label: { ko: 'DevOps', en: 'DevOps' } });
    const found = await store.getByName('devops');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('DevOps');
  });

  it('should return null for non-existent topic', async () => {
    const found = await store.getByName('Non-existent');
    expect(found).toBeNull();
  });

  it('should seed topics when empty', async () => {
    await store.ensureSeedTopics();
    const topics = await store.getAll();
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.every((t) => t.isSeed)).toBe(true);
  });

  it('should not re-seed if topics already exist', async () => {
    await store.add({ name: 'Custom', label: { ko: '커스텀', en: 'Custom' } });
    await store.ensureSeedTopics();
    const topics = await store.getAll();
    expect(topics).toHaveLength(1);
    expect(topics[0].name).toBe('Custom');
  });

  it('should return topic names', async () => {
    await store.add({ name: 'AI/ML', label: { ko: 'AI/ML', en: 'AI/ML' } });
    await store.add({ name: 'Frontend', label: { ko: '프론트엔드', en: 'Frontend' } });
    const names = await store.getNames();
    expect(names).toEqual(['AI/ML', 'Frontend']);
  });
});
