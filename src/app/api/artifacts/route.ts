import { NextRequest, NextResponse } from 'next/server';
import { artifactService } from '@/services/artifact-service';

export const runtime = 'edge';

/**
 * GET /api/artifacts
 * Fetch user's artifacts or global artifacts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const scope = searchParams.get('scope'); // 'personal', 'global', or 'all'
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    // Search
    if (search) {
      const artifacts = await artifactService.searchArtifacts(search, userId || undefined);
      return NextResponse.json({ success: true, artifacts });
    }

    // By tag
    if (tag) {
      const artifacts = await artifactService.getArtifactsByTag(tag);
      return NextResponse.json({ success: true, artifacts });
    }

    // By scope
    if (!userId) {
      // No user, return only global
      const artifacts = await artifactService.getGlobalArtifacts();
      return NextResponse.json({ success: true, artifacts });
    }

    if (scope === 'personal') {
      const artifacts = await artifactService.getPersonalArtifacts(userId);
      return NextResponse.json({ success: true, artifacts });
    } else if (scope === 'global') {
      const artifacts = await artifactService.getGlobalArtifacts();
      return NextResponse.json({ success: true, artifacts });
    } else {
      // Default: all (personal + global)
      const artifacts = await artifactService.getUserArtifacts(userId);
      return NextResponse.json({ success: true, artifacts });
    }
  } catch (error) {
    console.error('❌ Error fetching artifacts:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/artifacts
 * Save a new artifact
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, code, language, artifact_type, tags, is_global } = body;

    console.log('📝 Saving artifact:', { userId, title, language, artifact_type, codeLength: code?.length });

    if (!userId || !title || !code || !language) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, title, code, language' },
        { status: 400 }
      );
    }

    const artifact = await artifactService.saveArtifact(userId, {
      title,
      description,
      code,
      language,
      artifact_type,
      tags,
      is_global: is_global || false,
    });

    if (!artifact) {
      console.error('❌ artifactService.saveArtifact returned null - check Supabase table exists');
      return NextResponse.json(
        { success: false, error: 'Failed to save artifact - Check if ai_artifacts table exists in Supabase' },
        { status: 500 }
      );
    }

    console.log('✅ Artifact saved successfully:', artifact.id);
    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('❌ Error saving artifact:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
