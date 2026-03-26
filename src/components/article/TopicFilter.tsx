'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { Topic, SupportedLocale } from '@/types';

interface TopicFilterProps {
  topics: Topic[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
}

export function TopicFilter({ topics, selectedTopic, onTopicChange }: TopicFilterProps) {
  const t = useTranslations('article');
  const locale = useLocale() as SupportedLocale;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onTopicChange(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          selectedTopic === null
            ? 'bg-accent text-white'
            : 'bg-surface-hover text-muted hover:text-foreground'
        }`}
      >
        {t('allTopics')}
      </button>
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onTopicChange(topic.name)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedTopic === topic.name
              ? 'bg-accent text-white'
              : 'bg-surface-hover text-muted hover:text-foreground'
          }`}
        >
          {topic.label[locale] || topic.name}
        </button>
      ))}
    </div>
  );
}
