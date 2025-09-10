import React from 'react';
import { useUserPointsBalance } from '../../../hooks/useRewards';

interface PointsBalanceSimpleProps {
  userId: number;
}

export const PointsBalanceSimple: React.FC<PointsBalanceSimpleProps> = ({ userId }) => {
  const { data: balance, isLoading, error } = useUserPointsBalance(userId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-300 font-medium text-xs mb-2" style={{ fontFamily: 'Tiempo, serif' }}>CURRENT BALANCE</div>
        <div className="text-neutral-400 text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-300 font-medium text-xs mb-2" style={{ fontFamily: 'Tiempo, serif' }}>CURRENT BALANCE</div>
        <div className="text-red-400 text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Error loading balance</div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-300 font-medium text-xs mb-2" style={{ fontFamily: 'Tiempo, serif' }}>CURRENT BALANCE</div>
        <div className="text-neutral-400 text-xs" style={{ fontFamily: 'Tiempo, serif' }}>No data available</div>
      </div>
    );
  }

  // Extract just the number and unit from the points label
  const [singular, plural] = balance.points_label.split(':') || ['Point', 'Points'];
  const pointsUnit = balance.balance === 1 ? singular : plural;

  return (
    <div className="space-y-2">
      <div className="text-neutral-300 font-medium text-xs mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
        CURRENT BALANCE
      </div>
      <div className="text-white text-lg font-semibold" style={{ fontFamily: 'Tiempo, serif' }}>
        {balance.balance.toLocaleString()} {pointsUnit}
      </div>
    </div>
  );
};


