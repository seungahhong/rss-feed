import { useTranslations } from 'next-intl';
import { FeedList } from '@/components/feed/FeedList';

export default function FeedsPage() {
  const t = useTranslations('nav');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('feeds')}</h1>
      <FeedList />
    </div>
  );
}
