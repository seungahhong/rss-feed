'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const icon = theme === 'dark' ? '◐' : theme === 'light' ? '○' : '●';

  return (
    <button
      onClick={() => setTheme(next)}
      className="flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      aria-label={`Switch to ${next} theme`}
    >
      {icon}
    </button>
  );
}
