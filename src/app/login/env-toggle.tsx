'use client';

import { useEffect, useState } from 'react';

type ApiEnvironment = 'docker' | 'production';

export function EnvironmentToggle() {
  const [env, setEnv] = useState<ApiEnvironment>('production');

  useEffect(() => {
    // Read from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flora_pos_api_environment') as ApiEnvironment || 'production';
      setEnv(stored);
    }
  }, []);

  const toggle = () => {
    // Cycle: docker -> production -> docker
    const newEnv: ApiEnvironment = env === 'docker' ? 'production' : 'docker';
    localStorage.setItem('flora_pos_api_environment', newEnv);
    setEnv(newEnv);
  };

  const getEnvDisplay = () => {
    if (env === 'docker') {
      return { icon: '🐳', label: 'Docker (localhost:8080)', color: 'text-orange-400' };
    }
    return { icon: '☁️', label: 'Production', color: 'text-blue-400' };
  };

  const getNextLabel = () => {
    return env === 'docker' ? 'Production' : 'Docker';
  };

  const display = getEnvDisplay();

  return (
    <div className="mb-6 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-400 mb-1">API Environment</div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${display.color}`}>
              {display.icon} {display.label}
            </span>
          </div>
        </div>
        <button
          onClick={toggle}
          className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
        >
          Switch to {getNextLabel()}
        </button>
      </div>
      {env === 'docker' && (
        <div className="mt-2 text-xs text-neutral-500">
          Dev login: admin / admin123
        </div>
      )}
    </div>
  );
}
