'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { YearTabs } from './YearTabs';
import { TopicFilter } from './TopicFilter';
import { ArticleList } from './ArticleList';
import { AiSearchSidebar } from '@/components/sidebar/AiSearchSidebar';
import type { Topic } from '@/types';

export function HomeContent() {
  const t = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedTopic = searchParams.get('topic') || null;
  const selectedYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset page when filters change
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, router, pathname],
  );

  const handleTopicChange = useCallback(
    (topic: string | null) => {
      updateParams({ topic });
    },
    [updateParams],
  );

  const handleYearChange = useCallback(
    (year: number | null) => {
      updateParams({ year: year ? String(year) : null });
    },
    [updateParams],
  );

  // Fetch topics and years
  useEffect(() => {
    fetch('/api/topics')
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.topics) setTopics(res.data.topics);
      })
      .catch(() => {});

    fetch('/api/articles?limit=1000&lang=ko')
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.articles) {
          const yearSet = new Set<number>();
          for (const a of res.data.articles) {
            const d = new Date(a.publishedAt);
            if (!isNaN(d.getTime())) yearSet.add(d.getFullYear());
          }
          setYears(Array.from(yearSet).sort((a, b) => b - a));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex gap-0 lg:gap-6">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{t('appName')}</h1>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md border border-border p-2 text-muted transition-colors hover:text-foreground lg:hidden"
            aria-label="AI Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        </div>

        {years.length > 0 && (
          <YearTabs
            years={years}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
        )}

        {topics.length > 0 && (
          <TopicFilter
            topics={topics}
            selectedTopic={selectedTopic}
            onTopicChange={handleTopicChange}
          />
        )}

        <ArticleList topic={selectedTopic} year={selectedYear} />
      </div>

      {/* Sidebar - always rendered on lg+, toggled on mobile */}
      <div className="hidden lg:block">
        <AiSearchSidebar
          topic={selectedTopic}
          year={selectedYear}
          isOpen={true}
          onClose={() => {}}
        />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <AiSearchSidebar
          topic={selectedTopic}
          year={selectedYear}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
