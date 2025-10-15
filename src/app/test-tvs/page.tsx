'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function TestTVsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tvs, setTVs] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const locationId = user?.location_id ? parseInt(user.location_id) : 20;

  const loadTVs = async () => {
    try {
      setDebugInfo('Loading TVs...');
      const { data, error } = await supabase
        .from('tv_devices')
        .select('*')
        .eq('location_id', locationId)
        .order('tv_number');
      
      if (error) {
        setDebugInfo(`Load Error: ${error.message}`);
        console.error('Load error:', error);
      } else {
        setDebugInfo(`Loaded ${data?.length || 0} TVs`);
        setTVs(data || []);
      }
    } catch (err: any) {
      setDebugInfo(`Exception: ${err.message}`);
    }
  };

  // Load on mount
  useEffect(() => {
    loadTVs();
  }, [locationId]);

  const addTestTVs = async () => {
    setLoading(true);
    setMessage('');
    setDebugInfo('Starting to add TVs...');

    try {
      // First, delete any existing TVs for this location to avoid duplicates
      setDebugInfo('Deleting existing TVs...');
      const { error: deleteError } = await supabase
        .from('tv_devices')
        .delete()
        .eq('location_id', locationId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        setDebugInfo(`Delete failed: ${deleteError.message}`);
      }

      // Now insert fresh TVs
      const testTVs = [
        {
          device_name: 'Front Counter Display',
          tv_number: 1,
          location_id: locationId,
          status: 'online',
          last_seen: new Date().toISOString(),
          metadata: {
            screen_width: 1920,
            screen_height: 1080,
            current_url: `${window.location.origin}/menu-display?location_id=${locationId}&tv_number=1`
          }
        },
        {
          device_name: 'Waiting Area TV',
          tv_number: 2,
          location_id: locationId,
          status: 'online',
          last_seen: new Date().toISOString(),
          metadata: {
            screen_width: 1920,
            screen_height: 1080,
            current_url: `${window.location.origin}/menu-display?location_id=${locationId}&tv_number=2`
          }
        },
        {
          device_name: 'Back Office Monitor',
          tv_number: 3,
          location_id: locationId,
          status: 'online',
          last_seen: new Date().toISOString(),
          metadata: {
            screen_width: 1920,
            screen_height: 1080,
            current_url: `${window.location.origin}/menu-display?location_id=${locationId}&tv_number=3`
          }
        }
      ];

      setDebugInfo('Inserting new TVs...');
      const { data, error } = await supabase
        .from('tv_devices')
        .insert(testTVs)
        .select();

      if (error) {
        console.error('Insert error:', error);
        setDebugInfo(`Insert failed: ${error.message}`);
        throw error;
      }

      setMessage(`✅ Successfully added ${data.length} test TVs!`);
      setDebugInfo(`Success! Added ${data.length} TVs`);
      await loadTVs();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      console.error('Full error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllTVs = async () => {
    if (!confirm('Delete all TV devices for this location?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tv_devices')
        .delete()
        .eq('location_id', locationId);

      if (error) throw error;

      setMessage('✅ Cleared all TVs');
      setTVs([]);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">TV Device Manager</h1>
        <p className="text-white/60 mb-2">
          Location: <span className="text-white">{user?.location || 'Unknown'}</span> (ID: {locationId})
        </p>
        {debugInfo && (
          <p className="text-xs text-white/40 mb-8 font-mono">Debug: {debugInfo}</p>
        )}

        <div className="space-y-4 mb-8">
          <button
            onClick={addTestTVs}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Adding...' : 'Add 3 Test TVs'}
          </button>

          <button
            onClick={loadTVs}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors ml-4"
          >
            Refresh TVs
          </button>

          <button
            onClick={clearAllTVs}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:opacity-50 rounded-lg font-medium transition-colors ml-4"
          >
            Clear All TVs
          </button>
        </div>

        {message && (
          <div className="p-4 bg-white/10 rounded-lg mb-8">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Current TVs ({tvs.length})</h2>
          
          {tvs.length === 0 ? (
            <p className="text-white/60">No TVs found. Add test TVs above.</p>
          ) : (
            <div className="space-y-2">
              {tvs.map(tv => (
                <div key={tv.id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">TV {tv.tv_number}: {tv.device_name}</h3>
                      <p className="text-sm text-white/60">ID: {tv.id}</p>
                      <p className="text-sm text-white/60">Last seen: {new Date(tv.last_seen).toLocaleString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      new Date(tv.last_seen).getTime() > Date.now() - 20000
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {new Date(tv.last_seen).getTime() > Date.now() - 20000 ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <a href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to POS
          </a>
        </div>
      </div>
    </div>
  );
}

