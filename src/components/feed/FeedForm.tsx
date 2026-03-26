'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface FeedFormProps {
  onAdded?: () => void;
}

export function FeedForm({ onAdded }: FeedFormProps) {
  const t = useTranslations('feed');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add feed');
        return;
      }
      setUrl('');
      setName('');
      setCategory('');
      onAdded?.();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold tracking-tight">{t('addFeed')}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('urlPlaceholder')}
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t('category')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? '...' : t('addFeed')}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}
