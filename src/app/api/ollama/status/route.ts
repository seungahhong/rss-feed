import { NextResponse } from 'next/server';
import { settingsStore } from '@/lib/store';

export async function GET() {
  const settings = await settingsStore.get();

  try {
    const response = await fetch(`${settings.ai.ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({
        data: { available: false, error: `HTTP ${response.status}` },
      });
    }

    const data = await response.json();
    const models = (data.models || []).map((m: { name: string }) => m.name);

    return NextResponse.json({
      data: {
        available: true,
        models,
        currentModel: settings.ai.model,
        hasCurrentModel: models.some((m: string) => m.startsWith(settings.ai.model)),
      },
    });
  } catch (error) {
    return NextResponse.json({
      data: {
        available: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
    });
  }
}
