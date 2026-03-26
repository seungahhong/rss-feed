import * as fs from 'fs/promises';
import * as path from 'path';
import writeFileAtomic from 'write-file-atomic';
import { Mutex } from 'async-mutex';

export class BaseStore<T> {
  private filePath: string;
  private defaultData: T;
  private mutex: Mutex;

  constructor(filePath: string, defaultData: T) {
    this.filePath = filePath;
    this.defaultData = defaultData;
    this.mutex = new Mutex();
  }

  async read(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return structuredClone(this.defaultData);
    }
  }

  async write(data: T): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFileAtomic(this.filePath, JSON.stringify(data, null, 2));
    });
  }

  async update(updater: (data: T) => T): Promise<T> {
    return this.mutex.runExclusive(async () => {
      const data = await this.readRaw();
      const updated = updater(data);
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFileAtomic(this.filePath, JSON.stringify(updated, null, 2));
      return updated;
    });
  }

  private async readRaw(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return structuredClone(this.defaultData);
    }
  }
}
