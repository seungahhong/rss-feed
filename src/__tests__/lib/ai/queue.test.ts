import { SummaryQueue } from '@/lib/ai/queue';

describe('SummaryQueue', () => {
  it('should process jobs sequentially', async () => {
    const order: number[] = [];
    const queue = new SummaryQueue();

    const job1 = queue.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
      return 'result-1';
    });
    const job2 = queue.enqueue(async () => {
      order.push(2);
      return 'result-2';
    });

    const [r1, r2] = await Promise.all([job1, job2]);
    expect(order).toEqual([1, 2]);
    expect(r1).toBe('result-1');
    expect(r2).toBe('result-2');
  });

  it('should report queue size', async () => {
    const queue = new SummaryQueue();
    let resolveFirst: () => void;
    const blocker = new Promise<void>((r) => {
      resolveFirst = r;
    });

    const job1 = queue.enqueue(async () => {
      await blocker;
      return 'done';
    });
    queue.enqueue(async () => 'queued');

    expect(queue.size).toBeGreaterThanOrEqual(1); // at least one task waiting
    resolveFirst!();
    await job1;
  });

  it('should handle errors without blocking the queue', async () => {
    const queue = new SummaryQueue();

    const job1 = queue.enqueue(async () => {
      throw new Error('fail');
    });
    const job2 = queue.enqueue(async () => 'success');

    await expect(job1).rejects.toThrow('fail');
    expect(await job2).toBe('success');
  });
});
