'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ThreeBackground } from '../../components/ui/ThreeBackground';
import { RetroButton } from '../../components/ui/RetroButton';
import { MatrixRain } from '../../components/ui/MatrixRain';
import { EnvironmentToggle } from './env-toggle';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowMatrix(true); // Trigger Matrix rain effect

    const success = await login(username, password);
    
    if (success) {
      // Keep Matrix effect showing during redirect
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/');
    } else {
      setError('Invalid WordPress credentials. Please check your username and password.');
      setShowMatrix(false); // Hide Matrix on error
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <ThreeBackground />
      <MatrixRain active={showMatrix} />
      
      {/* CRT Scan Lines Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
          zIndex: 999,
          animation: 'scan 8s linear infinite'
        }}
      />
      
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 51, 51, 0.8)); }
          50% { filter: drop-shadow(0 0 20px rgba(255, 51, 51, 1)); }
        }
      `}</style>
      
      <div 
        className="fixed"
        style={{ 
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '420px',
          zIndex: 10,
          border: '4px solid #ff3333',
          boxShadow: '0 0 20px rgba(255, 51, 51, 0.8), inset 0 0 20px rgba(255, 51, 51, 0.2)',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 0, 0, 0.9) 100%)',
          animation: 'flicker 0.15s infinite',
          padding: '6px'
        }}
      >
        {/* Inner content with retro border */}
        <div style={{
          border: '2px solid #661111',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.7)'
        }}>
          {/* Header */}
          <div className="px-2 py-4">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image 
                  src="/logo123.png" 
                  alt="Flora Distro Logo" 
                  width={120} 
                  height={120}
                  className="object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: 'contrast(1.2) brightness(1.1) drop-shadow(0 0 10px rgba(255, 51, 51, 0.5))',
                    animation: 'glow 2s ease-in-out infinite'
                  }}
                />
              </div>
              <h3 
                className="text-3xl mb-2"
                style={{ 
                  fontFamily: 'DonGraffiti',
                  color: '#ff3333',
                  textShadow: '2px 2px 0px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 51, 51, 0.8), 0 0 30px rgba(255, 51, 51, 0.6)',
                  letterSpacing: '3px'
                }}
              >
                FLORA DISTRO
              </h3>
              <div 
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: '#ff6666',
                  letterSpacing: '2px',
                  textShadow: '0 0 5px rgba(255, 51, 51, 0.5)'
                }}
              >
                █ PRESS START █
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="py-2 px-4">
            {/* Environment Toggle */}
            <EnvironmentToggle />
            
            <form onSubmit={handleSubmit} className="space-y-4 py-3">
              {error && (
                <div 
                  style={{
                    background: 'rgba(255, 0, 0, 0.2)',
                    border: '2px solid #ff3333',
                    boxShadow: '0 0 10px rgba(255, 51, 51, 0.5), inset 0 0 10px rgba(255, 0, 0, 0.3)',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#ff6666',
                    letterSpacing: '1px',
                    textShadow: '0 0 5px rgba(255, 51, 51, 0.8)'
                  }}
                >
                  ⚠ {error.toUpperCase()}
                </div>
              )}

              <div className="space-y-4">
                {/* Username Input */}
                <div>
                  <div 
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: '#ff6666',
                      marginBottom: '6px',
                      letterSpacing: '1px',
                      textShadow: '0 0 5px rgba(255, 51, 51, 0.5)'
                    }}
                  >
                    {'>'} USERNAME:
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ 
                      fontFamily: 'monospace',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid #661111',
                      boxShadow: '0 0 5px rgba(255, 51, 51, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.8)',
                      color: '#cccccc',
                      fontSize: '12px',
                      letterSpacing: '1px',
                      textShadow: '0 0 3px rgba(255, 255, 255, 0.3)'
                    }}
                    className="w-full px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:shadow-[0_0_15px_rgba(255,51,51,0.5)]"
                    placeholder="ENTER USERNAME"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div 
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: '#ff6666',
                      marginBottom: '6px',
                      letterSpacing: '1px',
                      textShadow: '0 0 5px rgba(255, 51, 51, 0.5)'
                    }}
                  >
                    {'>'} PASSWORD:
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                      fontFamily: 'monospace',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid #661111',
                      boxShadow: '0 0 5px rgba(255, 51, 51, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.8)',
                      color: '#cccccc',
                      fontSize: '12px',
                      letterSpacing: '1px',
                      textShadow: '0 0 3px rgba(255, 255, 255, 0.3)'
                    }}
                    className="w-full px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:shadow-[0_0_15px_rgba(255,51,51,0.5)]"
                    placeholder="ENTER PASSWORD"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="pt-4">
                <RetroButton
                  onClick={handleSubmit}
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  ▶ SIGN IN ◀
                </RetroButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
