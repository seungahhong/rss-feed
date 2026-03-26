import { useTranslations } from 'next-intl';
import { SearchPage } from '@/components/search/SearchPage';

export default function Search() {
  const t = useTranslations('nav');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('search')}</h1>
      <SearchPage />
    </div>
  );
}
