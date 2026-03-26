'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FeedForm } from './FeedForm';
import type { Feed } from '@/types';

export function FeedList() {
  const t = useTranslations('feed');
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/feeds');
      const data = await res.json();
      setFeeds(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await fetch(`/api/feeds?id=${id}`, { method: 'DELETE' });
    fetchFeeds();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeedForm onAdded={fetchFeeds} />

      {feeds.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{t('noFeeds')}</p>
      ) : (
        <div className="space-y-2">
          {feeds.map((feed, i) => (
            <div
              key={feed.id}
              className={`animate-fade-in opacity-0 stagger-${Math.min(i, 5)} flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent/30`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-medium">{feed.name}</h3>
                  {feed.category && (
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                      {feed.category}
                    </span>
                  )}
                  <span
                    className={`shrink-0 h-1.5 w-1.5 rounded-full ${feed.active ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{feed.url}</p>
              </div>
              <button
                onClick={() => handleDelete(feed.id)}
                className="ml-4 shrink-0 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                {t('deleteFeed')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
