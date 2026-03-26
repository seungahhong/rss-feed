import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { RefreshButton } from '@/components/ui/RefreshButton';

export function Header() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-bold tracking-tight text-accent">
            rss·ai
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t('home')}
            </Link>
            <Link
              href="/feeds"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t('feeds')}
            </Link>
            <Link
              href="/search"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t('search')}
            </Link>
            <Link
              href="/settings"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t('settings')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <RefreshButton />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
