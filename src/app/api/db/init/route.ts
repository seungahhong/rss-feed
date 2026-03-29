import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/schema';

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ data: { message: 'Database initialized successfully' } });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database initialization failed' },
      { status: 500 },
    );
  }
}
