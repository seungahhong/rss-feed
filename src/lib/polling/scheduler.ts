import type { PollingConfig } from '@/types';

export class PollingScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private callback: (() => Promise<void>) | null = null;
  private config: PollingConfig | null = null;
  private lastRunDate: string | null = null;

  get isRunning(): boolean {
    return this.timer !== null;
  }

  start(callback: () => Promise<void>, config: PollingConfig): void {
    if (this.timer) return;

    this.callback = callback;
    this.config = config;

    // 매분 체크하여 스케줄에 맞으면 실행
    this.timer = setInterval(() => {
      this.checkAndExecute();
    }, 60 * 1000);

    console.log(`[Scheduler] Started with schedule: ${describeSchedule(config)}`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.callback = null;
    this.config = null;
  }

  updateConfig(config: PollingConfig): void {
    if (this.timer && this.callback) {
      const cb = this.callback;
      this.stop();
      this.start(cb, config);
    }
    this.config = config;
  }

  private shouldRun(now: Date): boolean {
    if (!this.config) return false;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayKey = now.toISOString().slice(0, 10);

    switch (this.config.type) {
      case 'hourly': {
        // 매 N시간마다 실행 (정각 기준)
        const hour = now.getHours();
        if (now.getMinutes() !== 0) return false;
        if (hour % this.config.intervalHours !== 0) return false;
        const runKey = `${todayKey}-${hour}`;
        if (this.lastRunDate === runKey) return false;
        this.lastRunDate = runKey;
        return true;
      }
      case 'daily': {
        if (currentTime !== this.config.time) return false;
        if (this.lastRunDate === todayKey) return false;
        this.lastRunDate = todayKey;
        return true;
      }
      case 'weekly': {
        // JS: 0=일,1=월..6=토 → 우리: 0=월..6=일
        const jsDay = now.getDay();
        const ourDay = jsDay === 0 ? 6 : jsDay - 1;
        if (ourDay !== this.config.dayOfWeek) return false;
        if (currentTime !== this.config.time) return false;
        const weekKey = `${todayKey}-w`;
        if (this.lastRunDate === weekKey) return false;
        this.lastRunDate = weekKey;
        return true;
      }
      case 'monthly': {
        if (now.getDate() !== this.config.dayOfMonth) return false;
        if (currentTime !== this.config.time) return false;
        const monthKey = `${todayKey}-m`;
        if (this.lastRunDate === monthKey) return false;
        this.lastRunDate = monthKey;
        return true;
      }
      default:
        return false;
    }
  }

  private async checkAndExecute(): Promise<void> {
    if (this.running || !this.callback) return;

    const now = new Date();
    if (!this.shouldRun(now)) return;

    this.running = true;
    try {
      await this.callback();
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      this.running = false;
    }
  }
}

export function describeSchedule(config: PollingConfig): string {
  switch (config.type) {
    case 'hourly':
      return `every ${config.intervalHours} hour(s)`;
    case 'daily':
      return `daily at ${config.time}`;
    case 'weekly': {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return `weekly on ${days[config.dayOfWeek]} at ${config.time}`;
    }
    case 'monthly':
      return `monthly on day ${config.dayOfMonth} at ${config.time}`;
  }
}
