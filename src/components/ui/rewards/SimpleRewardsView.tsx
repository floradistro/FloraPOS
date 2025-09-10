import React from 'react';
import { PointsBalanceSimple } from './PointsBalanceSimple';
import { InlinePointsAdjustment } from './InlinePointsAdjustment';
import { PointsHistory } from './PointsHistory';
import { useUserPointsBalance, useUserPointsHistory } from '../../../hooks/useRewards';

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
  const { data: history } = useUserPointsHistory(userId, 1, 20);

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Points Balance & Adjustment */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <PointsBalanceSimple userId={userId} />
        </div>
        
        {isAdmin && (
          <div>
            <h3 className="text-neutral-300 font-medium text-xs mb-2" style={{ fontFamily: 'Tiempo, serif' }}>Quick Actions</h3>
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-neutral-300 font-medium text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Points History</h3>
          <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {history?.pagination.total || 0} total events
          </div>
        </div>
        <div className="bg-transparent rounded overflow-hidden flex-1 flex flex-col border border-neutral-600/30">
          <div className="flex-1 min-h-0">
            <PointsHistory userId={userId} initialPerPage={20} hideTotalEvents={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
