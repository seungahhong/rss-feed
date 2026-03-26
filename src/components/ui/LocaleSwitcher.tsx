'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next = locale === 'ko' ? 'en' : 'ko';
    router.replace(pathname, { locale: next });
  };

  return (
    <button
      onClick={toggle}
      className="flex h-8 items-center rounded-md px-2 text-xs font-medium tracking-wide text-muted uppercase transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      {locale === 'ko' ? 'EN' : '한국어'}
    </button>
  );
}
