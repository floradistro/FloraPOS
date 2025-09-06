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
        <div className="text-neutral-500 font-medium text-xs mb-2">Current Balance</div>
        <div className="text-neutral-400 text-xs">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-500 font-medium text-xs mb-2">Current Balance</div>
        <div className="text-red-400 text-xs">Error loading balance</div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-500 font-medium text-xs mb-2">Current Balance</div>
        <div className="text-neutral-400 text-xs">No data available</div>
      </div>
    );
  }

  // Extract just the number and unit from the points label
  const [singular, plural] = balance.points_label.split(':') || ['Point', 'Points'];
  const pointsUnit = balance.balance === 1 ? singular : plural;

  return (
    <div className="space-y-2">
      <div className="text-neutral-500 font-medium text-xs mb-2">
        CURRENT BALANCE
      </div>
      <div className="text-white text-lg font-semibold">
        {balance.balance.toLocaleString()} {pointsUnit}
      </div>
    </div>
  );
};


