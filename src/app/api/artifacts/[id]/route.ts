import { NextRequest, NextResponse } from 'next/server';
import { artifactService } from '@/services/artifact-service';

/**
 * GET /api/artifacts/[id]
 * Fetch a specific artifact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifact = await artifactService.getArtifactById(params.id);

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('❌ Error fetching artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/artifacts/[id]
 * Update an artifact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    const artifact = await artifactService.updateArtifact(params.id, updates);

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Failed to update artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('❌ Error updating artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/artifacts/[id]
 * Delete an artifact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await artifactService.deleteArtifact(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
