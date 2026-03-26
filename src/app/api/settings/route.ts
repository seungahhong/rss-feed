import { NextRequest, NextResponse } from 'next/server';
import { settingsStore } from '@/lib/store';

export async function GET() {
  const settings = await settingsStore.get();
  return NextResponse.json({ data: settings });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const settings = await settingsStore.patch(body);
  return NextResponse.json({ data: settings });
}
