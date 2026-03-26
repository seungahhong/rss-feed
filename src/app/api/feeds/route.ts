import { NextRequest, NextResponse } from 'next/server';
import { feedStore } from '@/lib/store';
import { isValidRssUrl } from '@/lib/utils/url-validator';

export async function GET() {
  const feeds = await feedStore.getAll();
  return NextResponse.json({ data: feeds });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, name, category = '' } = body;

  if (!url || !name) {
    return NextResponse.json({ error: 'url and name are required' }, { status: 400 });
  }

  const validation = isValidRssUrl(url);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const feed = await feedStore.add({ url, name, category });
  return NextResponse.json({ data: feed }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const deleted = await feedStore.delete(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true } });
}
