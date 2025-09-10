import React, { useState, useEffect, useRef } from 'react';
import { useAdjustUserPoints } from '../../../hooks/useRewards';

interface InlinePointsAdjustmentProps {
  userId: number;
  userName: string;
  currentBalance?: number;
  onSuccess?: () => void;
}

export const InlinePointsAdjustment: React.FC<InlinePointsAdjustmentProps> = ({
  userId,
  userName,
  currentBalance = 0,
  onSuccess,
}) => {
  const [points, setPoints] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  const reasonPresets = [
    'Customer service credit',
    'Loyalty bonus',
    'Referral reward',
    'Birthday bonus',
    'Compensation for issue',
    'Promotional reward',
    'Manual correction',
    'Points expiry adjustment'
  ];

  // Close presets dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    if (showPresets) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPresets]);

  const adjustPoints = useAdjustUserPoints();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!points || !description.trim()) {
      setError('Points and description are required');
      return;
    }

    try {
      await adjustPoints.mutateAsync({
        userId,
        request: {
          points,
          description: description.trim(),
        },
      });

      // Reset form
      setPoints(0);
      setDescription('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust points');
    }
  };

  const newBalance = currentBalance + points;
  const isPositive = points > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={points || ''}
          onChange={(e) => setPoints(Number(e.target.value) || 0)}
          placeholder="Points"
          className="px-2 py-1 bg-transparent border border-neutral-600/40 rounded text-neutral-300 focus:border-neutral-400/60 focus:outline-none text-xs placeholder:text-neutral-500"
          style={{ fontFamily: 'Tiempo, serif' }}
          disabled={adjustPoints.isPending}
        />
        <div className="relative flex-1" ref={presetRef}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reason (e.g., Customer service credit, Loyalty bonus, Referral reward)"
            className="w-full px-2 py-1 bg-transparent border border-neutral-600/40 rounded text-neutral-300 focus:border-neutral-400/60 focus:outline-none text-xs pr-8 placeholder:text-neutral-500"
            style={{ fontFamily: 'Tiempo, serif' }}
            disabled={adjustPoints.isPending}
          />
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
            disabled={adjustPoints.isPending}
          >
            ▼
          </button>
          
          {showPresets && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-transparent backdrop-blur border border-neutral-600/40 rounded text-xs z-10 max-h-32 overflow-y-auto">
              {reasonPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setDescription(preset);
                    setShowPresets(false);
                  }}
                  className="w-full px-2 py-1 text-left hover:bg-gradient-to-r hover:from-neutral-700/20 hover:to-neutral-800/20 text-neutral-300 hover:text-white transition-colors"
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {points !== 0 && (
        <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
          {currentBalance.toLocaleString()} → {' '}
          <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
            {newBalance.toLocaleString()}
          </span>
        </div>
      )}

      {(error || adjustPoints.error) && (
        <div className="text-xs text-red-400" style={{ fontFamily: 'Tiempo, serif' }}>
          {error || adjustPoints.error?.message}
        </div>
      )}

      <button
        type="submit"
        className="w-full px-2 py-1 bg-transparent hover:bg-neutral-600/10 border border-neutral-600/40 hover:border-neutral-500/50 rounded text-neutral-400 hover:text-neutral-300 text-xs transition-colors disabled:opacity-50"
        style={{ fontFamily: 'Tiempo, serif' }}
        disabled={!points || !description.trim() || adjustPoints.isPending}
      >
        {adjustPoints.isPending ? 'Adjusting...' : 'Adjust Points'}
      </button>
    </form>
  );
};


