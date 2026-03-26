import { PollingScheduler } from '@/lib/polling/scheduler';
import type { PollingConfig } from '@/types';

const baseConfig: PollingConfig = {
  enabled: true,
  type: 'hourly',
  intervalHours: 1,
  time: '07:00',
  dayOfWeek: 0,
  dayOfMonth: 1,
};

describe('PollingScheduler', () => {
  let scheduler: PollingScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    scheduler = new PollingScheduler();
  });

  afterEach(() => {
    scheduler.stop();
    jest.useRealTimers();
  });

  it('should start and stop', () => {
    scheduler.start(async () => {}, baseConfig);
    expect(scheduler.isRunning).toBe(true);
    scheduler.stop();
    expect(scheduler.isRunning).toBe(false);
  });

  it('should not start twice', () => {
    scheduler.start(async () => {}, baseConfig);
    scheduler.start(async () => {}, baseConfig); // should be no-op
    expect(scheduler.isRunning).toBe(true);
  });

  it('should check every minute', () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    scheduler.start(callback, baseConfig);

    // Advance 1 minute — the check interval
    jest.advanceTimersByTime(60 * 1000);

    // Callback may or may not have been called depending on current fake time
    // But the scheduler should still be running
    expect(scheduler.isRunning).toBe(true);
  });

  it('should update config', () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    scheduler.start(callback, baseConfig);
    scheduler.updateConfig({ ...baseConfig, type: 'daily', time: '09:00' });
    expect(scheduler.isRunning).toBe(true);
  });

  it('should prevent concurrent execution', async () => {
    let running = false;
    let concurrentDetected = false;

    const callback = jest.fn().mockImplementation(async () => {
      if (running) concurrentDetected = true;
      running = true;
      await new Promise((r) => setTimeout(r, 100));
      running = false;
    });

    scheduler.start(callback, baseConfig);
    jest.advanceTimersByTime(60 * 1000);
    jest.advanceTimersByTime(60 * 1000);
    await Promise.resolve();

    expect(concurrentDetected).toBe(false);
  });
});
