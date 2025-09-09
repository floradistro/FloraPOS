'use client';

import React, { useState } from 'react';

export const BatchAuditTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testBatchAudit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing batch audit functionality...');

      // Test data - sample adjustments
      const testAdjustments = [
        {
          product_id: 123,
          variation_id: null,
          adjustment_quantity: 5,
          reason: 'Test batch audit - increase stock',
          location_id: 20
        },
        {
          product_id: 456,
          variation_id: null,
          adjustment_quantity: -2,
          reason: 'Test batch audit - decrease stock',
          location_id: 20
        }
      ];

      const response = await fetch('/api/inventory/batch-adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_name: 'Test Batch Audit',
          batch_description: 'Testing the new batch audit functionality',
          location_id: 20,
          user_id: 1,
          user_name: 'Test User',
          adjustments: testAdjustments
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Batch audit test successful:', data);
        setResult(data);
      } else {
        console.error('❌ Batch audit test failed:', data);
        setError(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ Test error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="p-6 bg-neutral-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Batch Audit System Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testBatchAudit}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              isLoading 
                ? 'bg-neutral-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Testing...' : 'Test Batch Audit'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-900/50 border border-green-600 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2">Success</h3>
            <pre className="text-green-300 text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
