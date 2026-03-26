export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { PollingScheduler } = await import('./lib/polling/scheduler');
    const { settingsStore } = await import('./lib/store');

    const scheduler = new PollingScheduler();
    const settings = await settingsStore.get();

    if (settings.polling.enabled) {
      scheduler.start(async () => {
        try {
          await fetch(`http://localhost:${process.env.PORT || 3000}/api/feeds/refresh`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Auto-polling failed:', error);
        }
      }, settings.polling);
    }
  }
}
