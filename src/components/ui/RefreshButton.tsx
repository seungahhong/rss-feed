'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function RefreshButton() {
  const t = useTranslations('refresh');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRefresh = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/feeds/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium transition-all hover:bg-surface-hover disabled:opacity-50"
    >
      <span className={loading ? 'animate-spin' : ''}>↻</span>
      {loading ? t('refreshing') : status === 'success' ? t('success') : status === 'error' ? t('error') : t('button')}
    </button>
  );
}
