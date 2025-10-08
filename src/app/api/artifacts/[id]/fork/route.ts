import { NextRequest, NextResponse } from 'next/server';
import { artifactService } from '@/services/artifact-service';

/**
 * POST /api/artifacts/[id]/fork
 * Fork an artifact (create a personal copy)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, title } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const artifact = await artifactService.forkArtifact(params.id, userId, title);

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Failed to fork artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('❌ Error forking artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
