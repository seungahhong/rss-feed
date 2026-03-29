import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initializeDatabase } from '@/lib/db/schema';

export async function POST() {
  try {
    await sql`DROP TABLE IF EXISTS summaries CASCADE`;
    await sql`DROP TABLE IF EXISTS articles CASCADE`;
    await sql`DROP TABLE IF EXISTS feeds CASCADE`;
    await sql`DROP TABLE IF EXISTS topics CASCADE`;
    await sql`DROP TABLE IF EXISTS settings CASCADE`;

    await initializeDatabase();

    return NextResponse.json({ data: { message: 'Database reset successfully' } });
  } catch (error) {
    console.error('Database reset failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database reset failed' },
      { status: 500 },
    );
  }
}
