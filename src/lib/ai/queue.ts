import { Mutex } from 'async-mutex';

export class SummaryQueue {
  private mutex = new Mutex();
  private waiting = 0;

  get size(): number {
    return this.waiting;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    this.waiting++;
    return this.mutex.runExclusive(async () => {
      this.waiting--;
      return task();
    });
  }
}
