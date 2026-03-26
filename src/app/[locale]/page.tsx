import { Suspense } from 'react';
import { HomeContent } from '@/components/article/HomeContent';

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
