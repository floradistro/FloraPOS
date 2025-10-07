import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for temporary artifacts (could move to Redis/DB later)
const tempArtifacts = new Map<string, {
  id: string;
  code: string;
  language: string;
  title: string;
  conversationId?: string;
  lastModified: number;
}>();

// Cleanup old temporary artifacts (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [id, artifact] of Array.from(tempArtifacts.entries())) {
    if (now - artifact.lastModified > twentyFourHours) {
      tempArtifacts.delete(id);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// GET - Retrieve temporary artifact
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Artifact ID required' }, { status: 400 });
    }
    
    const artifact = tempArtifacts.get(id);
    
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ artifact });
  } catch (error) {
    console.error('Error retrieving temporary artifact:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve artifact' },
      { status: 500 }
    );
  }
}

// POST - Save/Update temporary artifact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, language, title, conversationId } = body;
    
    if (!id || !code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const artifact = {
      id,
      code,
      language,
      title: title || `${language} Artifact`,
      conversationId,
      lastModified: Date.now()
    };
    
    tempArtifacts.set(id, artifact);
    
    console.log(`✅ Temporary artifact saved: ${id} (${code.length} chars)`);
    
    return NextResponse.json({ 
      success: true,
      artifact 
    });
  } catch (error) {
    console.error('Error saving temporary artifact:', error);
    return NextResponse.json(
      { error: 'Failed to save artifact' },
      { status: 500 }
    );
  }
}

// DELETE - Remove temporary artifact
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Artifact ID required' }, { status: 400 });
    }
    
    tempArtifacts.delete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting temporary artifact:', error);
    return NextResponse.json(
      { error: 'Failed to delete artifact' },
      { status: 500 }
    );
  }
}

