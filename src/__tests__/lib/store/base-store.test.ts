import { BaseStore } from '@/lib/store/base-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface TestData {
  items: Array<{ id: string; name: string }>;
}

const DEFAULT_DATA: TestData = { items: [] };

describe('BaseStore', () => {
  let tmpDir: string;
  let filePath: string;
  let store: BaseStore<TestData>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'store-test-'));
    filePath = path.join(tmpDir, 'test.json');
    store = new BaseStore<TestData>(filePath, DEFAULT_DATA);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should return default data when file does not exist', async () => {
    const data = await store.read();
    expect(data).toEqual(DEFAULT_DATA);
  });

  it('should write and read data', async () => {
    const newData: TestData = { items: [{ id: '1', name: 'test' }] };
    await store.write(newData);
    const data = await store.read();
    expect(data).toEqual(newData);
  });

  it('should persist data to file', async () => {
    const newData: TestData = { items: [{ id: '1', name: 'test' }] };
    await store.write(newData);
    const raw = await fs.readFile(filePath, 'utf-8');
    expect(JSON.parse(raw)).toEqual(newData);
  });

  it('should update data via callback', async () => {
    await store.write({ items: [{ id: '1', name: 'original' }] });
    await store.update((data) => {
      data.items[0].name = 'updated';
      return data;
    });
    const data = await store.read();
    expect(data.items[0].name).toBe('updated');
  });

  it('should handle concurrent writes without data loss', async () => {
    await store.write({ items: [] });
    const writes = Array.from({ length: 10 }, (_, i) =>
      store.update((data) => {
        data.items.push({ id: String(i), name: `item-${i}` });
        return data;
      }),
    );
    await Promise.all(writes);
    const data = await store.read();
    expect(data.items).toHaveLength(10);
  });

  it('should create parent directory if it does not exist', async () => {
    const nestedPath = path.join(tmpDir, 'nested', 'dir', 'test.json');
    const nestedStore = new BaseStore<TestData>(nestedPath, DEFAULT_DATA);
    await nestedStore.write({ items: [{ id: '1', name: 'nested' }] });
    const data = await nestedStore.read();
    expect(data.items[0].name).toBe('nested');
  });
});
