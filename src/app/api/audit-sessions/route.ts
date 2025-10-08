import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';


// In-memory storage for audit sessions (in production, use database)
const auditSessions = new Map<string, AuditSession>();

interface AuditSession {
  id: string;
  name: string;
  reason: string;
  location_id: number;
  user_id: number;
  user_name: string;
  started_at: string;
  completed_at?: string;
  status: 'active' | 'completed' | 'cancelled';
  adjustments: AuditAdjustment[];
  summary?: {
    total_products: number;
    total_increased: number;
    total_decreased: number;
    total_unchanged: number;
    net_change: number;
  };
}

interface AuditAdjustment {
  product_id: number;
  variation_id?: number;
  product_name: string;
  sku: string;
  old_quantity: number;
  new_quantity: number;
  adjustment: number;
  timestamp: string;
}

// GET - Retrieve audit sessions
export async function GET(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const locationId = searchParams.get('location_id');
    const status = searchParams.get('status');

    if (sessionId) {
      const session = auditSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: session });
    }

    // Filter sessions
    let sessions = Array.from(auditSessions.values());
    
    if (locationId) {
      sessions = sessions.filter(s => s.location_id === parseInt(locationId));
    }
    
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }

    // Sort by date descending
    sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    return NextResponse.json({
      success: true,
      data: sessions,
      total: sessions.length
    });

  } catch (error) {
    console.error('Error fetching audit sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit sessions' },
      { status: 500 }
    );
  }
}

// POST - Create new audit session or add adjustments
export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;

    const body = await request.json();
    const { action } = body;

    if (action === 'create_session') {
      // Create new audit session
      const { name, reason, location_id, user_id, user_name } = body;
      
      const sessionId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: AuditSession = {
        id: sessionId,
        name: name || `Physical Count ${new Date().toLocaleDateString()}`,
        reason: reason || 'Physical inventory count',
        location_id,
        user_id,
        user_name,
        started_at: new Date().toISOString(),
        status: 'active',
        adjustments: []
      };

      auditSessions.set(sessionId, session);

      return NextResponse.json({
        success: true,
        session_id: sessionId,
        message: 'Audit session created',
        data: session
      });

    } else if (action === 'add_adjustment') {
      // Add adjustment to existing session
      const { session_id, adjustment } = body;
      
      const session = auditSessions.get(session_id);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (session.status !== 'active') {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }

      session.adjustments.push({
        ...adjustment,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Adjustment added to session',
        total_adjustments: session.adjustments.length
      });

    } else if (action === 'complete_session') {
      // Complete the session and apply all adjustments
      const { session_id } = body;
      
      const session = auditSessions.get(session_id);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (session.status !== 'active') {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }

      console.log(`📦 Completing audit session ${session_id} with ${session.adjustments.length} adjustments`);

      // Get API environment and base URL
      const apiEnv = getApiEnvironmentFromRequest(request);
      const floraApiBase = 'https://api.floradistro.com';
      
      console.log(`🔄 [${apiEnv.toUpperCase()}] Creating audit batch in WordPress...`);
      
      // Step 1: Create audit batch in WordPress
      const batchUrl = `${floraApiBase}/wp-json/flora-im/v1/audit-batches?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      
      const batchData = {
        batch_name: session.name,
        batch_description: session.reason,
        location_id: session.location_id,
        user_id: session.user_id || 1,
        user_name: session.user_name || 'System'
      };

      const batchResponse = await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      });

      if (!batchResponse.ok) {
        const errorText = await batchResponse.text();
        console.error('❌ Failed to create audit batch:', errorText);
        return NextResponse.json({
          error: 'Failed to create audit batch in WordPress',
          details: errorText
        }, { status: 500 });
      }

      const batchResult = await batchResponse.json();
      const batchId = batchResult.batch_id;
      const auditNumber = batchResult.batch?.audit_number;
      
      console.log(`✅ Created audit batch: ${auditNumber} (ID: ${batchId})`);
      
      // Step 2: Start the batch
      const startUrl = `${floraApiBase}/wp-json/flora-im/v1/audit-batches/${batchId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      
      await fetch(startUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      // Step 3: Apply all adjustments to Flora IM with batch_id
      const results = await Promise.all(
        session.adjustments.map(async (adj) => {
          try {
            // Update inventory through Flora IM with batch_id for audit trail
            const updateUrl = `${floraApiBase}/wp-json/flora-im/v1/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            
            const updateData = {
              product_id: adj.product_id,
              variation_id: adj.variation_id || null,
              location_id: session.location_id,
              quantity: adj.new_quantity,
              batch_id: batchId,
              reason: session.reason,
              user_name: session.user_name
            };

            const updateResponse = await fetch(updateUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
              throw new Error(`Failed to update product ${adj.product_id}`);
            }

            return { success: true, product_id: adj.product_id };
          } catch (error) {
            console.error(`Failed to update product ${adj.product_id}:`, error);
            return { 
              success: false, 
              product_id: adj.product_id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      // Step 4: Complete the batch in WordPress
      const completeUrl = `${floraApiBase}/wp-json/flora-im/v1/audit-batches/${batchId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      
      await fetch(completeUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      });

      // Calculate summary
      const summary = {
        total_products: session.adjustments.length,
        total_increased: session.adjustments.filter(a => a.adjustment > 0).length,
        total_decreased: session.adjustments.filter(a => a.adjustment < 0).length,
        total_unchanged: session.adjustments.filter(a => a.adjustment === 0).length,
        net_change: session.adjustments.reduce((sum, a) => sum + a.adjustment, 0)
      };

      // Mark session as completed
      session.completed_at = new Date().toISOString();
      session.status = 'completed';
      session.summary = summary;

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `Audit session completed. ${successCount} products updated, ${failedCount} failed.`,
        audit_number: auditNumber,
        batch_id: batchId,
        session_id,
        summary,
        results
      });

    } else if (action === 'cancel_session') {
      // Cancel the session
      const { session_id } = body;
      
      const session = auditSessions.get(session_id);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      session.status = 'cancelled';
      session.completed_at = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: 'Audit session cancelled',
        session_id
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in audit session:', error);
    return NextResponse.json(
      { error: 'Failed to process audit session' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a session
export async function DELETE(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = auditSessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'active') {
      return NextResponse.json({ error: 'Cannot delete active session' }, { status: 400 });
    }

    auditSessions.delete(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session deleted'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

