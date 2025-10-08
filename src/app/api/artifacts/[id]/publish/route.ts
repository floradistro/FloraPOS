import { NextRequest, NextResponse } from 'next/server';
import { artifactService } from '@/services/artifact-service';

export const runtime = 'edge';

/**
 * POST /api/artifacts/[id]/publish
 * Publish an artifact (make it global)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifact = await artifactService.publishArtifact(params.id);

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('❌ Error publishing artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/artifacts/[id]/publish
 * Unpublish an artifact (make it private)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifact = await artifactService.unpublishArtifact(params.id);

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Failed to unpublish artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('❌ Error unpublishing artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
