'use client';

import { useEffect, useState } from 'react';

export function EnvironmentToggle() {
  const [env, setEnv] = useState('production');

  useEffect(() => {
    // Read from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flora_pos_api_environment') || 'production';
      setEnv(stored);
    }
  }, []);

  const toggle = () => {
    const newEnv = env === 'docker' ? 'production' : 'docker';
    localStorage.setItem('flora_pos_api_environment', newEnv);
    setEnv(newEnv);
  };

  return (
    <div className="mb-6 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-400 mb-1">API Environment</div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${env === 'docker' ? 'text-orange-400' : 'text-blue-400'}`}>
              {env === 'docker' ? '🐳 Docker (localhost:8081)' : '☁️ Production'}
            </span>
          </div>
        </div>
        <button
          onClick={toggle}
          className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
        >
          Switch to {env === 'docker' ? 'Production' : 'Docker'}
        </button>
      </div>
      {env === 'docker' && (
        <div className="mt-2 text-xs text-neutral-500">
          Login with: admin / admin123
        </div>
      )}
    </div>
  );
}

