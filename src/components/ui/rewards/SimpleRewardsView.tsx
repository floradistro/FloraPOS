import React from 'react';
import { PointsBalanceSimple } from './PointsBalanceSimple';
import { InlinePointsAdjustment } from './InlinePointsAdjustment';
import { PointsHistory } from './PointsHistory';
import { useUserPointsBalance } from '../../../hooks/useRewards';

interface SimpleRewardsViewProps {
  userId: number;
  userName: string;
  isAdmin?: boolean;
}

export const SimpleRewardsView: React.FC<SimpleRewardsViewProps> = ({
  userId,
  userName,
  isAdmin = false,
}) => {
  const { data: balance } = useUserPointsBalance(userId);

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Points Balance & Adjustment */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <h3 className="text-neutral-400 font-medium text-xs mb-2">Current Balance</h3>
          <PointsBalanceSimple userId={userId} />
        </div>
        
        {isAdmin && (
          <div>
            <h3 className="text-neutral-400 font-medium text-xs mb-2">Quick Actions</h3>
            <InlinePointsAdjustment
              userId={userId}
              userName={userName}
              currentBalance={balance?.balance}
            />
          </div>
        )}
      </div>

      {/* Points History */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-neutral-400 font-medium text-xs mb-2">Points History</h3>
        <div className="bg-neutral-900/40 rounded overflow-hidden flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            <PointsHistory userId={userId} initialPerPage={20} />
          </div>
        </div>
      </div>
    </div>
  );
};
