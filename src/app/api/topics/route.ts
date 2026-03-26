import { NextResponse } from 'next/server';
import { topicStore } from '@/lib/store';

export async function GET() {
  await topicStore.ensureSeedTopics();
  const topics = await topicStore.getAll();
  return NextResponse.json({ data: { topics } });
}
