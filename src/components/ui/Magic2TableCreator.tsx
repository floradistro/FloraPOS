'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

interface TableStatus {
  [key: string]: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  tables_status?: TableStatus;
  sql?: string;
  fallback_sql?: string;
  instructions?: string[];
  error?: string;
  details?: string;
}

export function Magic2TableCreator() {
  const [isCreating, setIsCreating] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const createTables = async () => {
    setIsCreating(true);
    setResponse(null);

    try {
      const res = await fetch('/api/magic2/create-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force_create: true,
          tables: ['cost_history', 'locations', 'purchase_orders', 'suppliers']
        })
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        message: 'Failed to create tables',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('SQL copied to clipboard!');
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Magic2 Database Tables</h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Create missing database tables for the Magic2 cost history plugin.
        </p>
        <p className="text-sm text-gray-500">
          This will fix the error: "Table 'avu_flora_im_cost_history' doesn't exist"
        </p>
      </div>

      <Button
        onClick={createTables}
        disabled={isCreating}
        className="mb-4"
      >
        {isCreating ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Creating Tables...
          </>
        ) : (
          'Create Magic2 Tables'
        )}
      </Button>

      {response && (
        <div className={`p-4 rounded-md ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${response.success ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`font-medium ${response.success ? 'text-green-800' : 'text-red-800'}`}>
              {response.success ? 'Success' : 'Error'}
            </span>
          </div>
          
          <p className={`mb-3 ${response.success ? 'text-green-700' : 'text-red-700'}`}>
            {response.message}
          </p>

          {response.tables_status && (
            <div className="mb-3">
              <h4 className="font-medium mb-2">Table Status:</h4>
              <div className="space-y-1">
                {Object.entries(response.tables_status).map(([table, exists]) => (
                  <div key={table} className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${exists ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-mono">{table}</span>
                    <span className={`ml-2 text-xs ${exists ? 'text-green-600' : 'text-red-600'}`}>
                      {exists ? 'EXISTS' : 'MISSING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(response.sql || response.fallback_sql) && (
            <div className="mb-3">
              <h4 className="font-medium mb-2">Manual SQL (if needed):</h4>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre>{response.sql || response.fallback_sql}</pre>
              </div>
              <Button
                onClick={() => copyToClipboard(response.sql || response.fallback_sql || '')}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                Copy SQL
              </Button>
            </div>
          )}

          {response.instructions && (
            <div>
              <h4 className="font-medium mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {response.instructions.map((instruction, index) => (
                  <li key={index} className="text-gray-700">{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          {response.error && (
            <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-sm">
              <strong>Error Details:</strong> {response.error}
              {response.details && (
                <div className="mt-1">
                  <strong>Additional Info:</strong> {response.details}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
