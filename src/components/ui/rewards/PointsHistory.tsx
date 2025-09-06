import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUserPointsHistory } from '../../../hooks/useRewards';
import { PointsHistoryEvent } from '../../../types/rewards';
import { LoadingSpinner } from '../LoadingSpinner';

interface PointsHistoryProps {
  userId: number;
  initialPerPage?: number;
  hideTotalEvents?: boolean;
}

interface HistoryEventItemProps {
  event: PointsHistoryEvent;
}

const HistoryEventItem: React.FC<HistoryEventItemProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatEventType = (type: string) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isPositive = event.points > 0;

  const eventDescription = event.description?.trim() || `${event.type.replace('-', ' ')} transaction`;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
      {/* Date */}
      <td className="px-3 py-3 text-neutral-400 text-xs align-top">
        {event.formatted_date || formatDate(event.date)}
      </td>
      
      {/* Type */}
      <td className="px-3 py-3 align-top">
        <span className="text-xs text-neutral-400">
          {formatEventType(event.type)}
        </span>
      </td>
      
      {/* Description */}
      <td className="px-3 py-3 text-neutral-500 text-xs align-top">
        <div className="truncate leading-relaxed" title={eventDescription}>
          {eventDescription}
        </div>
        {event.description?.trim() && event.description.trim() !== `${event.type.replace('-', ' ')} transaction` && (
          <div className="text-neutral-600 text-xs mt-1 italic">
            {event.type === 'manual-adjust' ? 'Reason: ' : 'Details: '}{event.description.trim()}
          </div>
        )}
      </td>
      
      {/* Order # */}
      <td className="px-3 py-3 text-neutral-500 text-xs align-top">
        {event.order_id ? `#${event.order_id}` : 'N/A'}
      </td>
      
      {/* Points */}
      <td className="px-3 py-3 text-right align-top">
        <span className={`text-xs font-semibold ${
          isPositive ? 'text-neutral-300' : 'text-neutral-300'
        }`}>
          {isPositive ? '+' : ''}{event.points.toLocaleString()} pts
        </span>
      </td>
    </tr>
  );
};

export const PointsHistory: React.FC<PointsHistoryProps> = ({ 
  userId, 
  initialPerPage = 20,
  hideTotalEvents = false
}) => {
  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<PointsHistoryEvent[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [perPage] = useState(initialPerPage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  
  const { data: history, isLoading, error } = useUserPointsHistory(userId, page, perPage);

  // Update events when new data comes in
  useEffect(() => {
    if (history?.events) {
      if (page === 1) {
        // First page - events should already be sorted by service, but ensure newest first
        setAllEvents(history.events);
        setLoadingMore(false);
        isLoadingRef.current = false;
      } else {
        // Subsequent pages - preserve scroll position
        const scrollElement = scrollRef.current;
        if (scrollElement && isLoadingRef.current) {
          // Store current scroll position before adding new items
          lastScrollTop.current = scrollElement.scrollTop;
        }
        
        // Deduplicate new events to prevent duplicate keys
        setAllEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = history.events.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      }
      setHasMore(page < history.pagination.total_pages);
    }
  }, [history, page]);

  // Restore scroll position after DOM update for infinite loading
  useEffect(() => {
    if (page > 1 && isLoadingRef.current && scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Use setTimeout to ensure all DOM updates are complete
      const timeoutId = setTimeout(() => {
        if (scrollElement && lastScrollTop.current > 0) {
          scrollElement.scrollTop = lastScrollTop.current;
        }
        setLoadingMore(false);
        isLoadingRef.current = false;
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [allEvents, page]);

  // Load more data
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isLoading) {
      // Store current scroll position before loading
      if (scrollRef.current) {
        lastScrollTop.current = scrollRef.current.scrollTop;
      }
      setLoadingMore(true);
      isLoadingRef.current = true;
      setPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore, isLoading]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Always track current scroll position
    lastScrollTop.current = scrollTop;
    
    // Load more when scrolled near bottom with proper checks
    if (
      scrollHeight - scrollTop <= clientHeight + 100 && 
      hasMore && 
      !loadingMore && 
      !isLoading
    ) {
      loadMore();
    }
  }, [loadMore, hasMore, loadingMore, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
          <div className="text-neutral-400 font-medium text-xs mb-3">
            Points History
          </div>
        </div>
        
        <div className="flex-1 bg-neutral-900/40 rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-neutral-400">Loading points history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
          <div className="text-neutral-400 font-medium text-xs mb-3">
            Points History
          </div>
        </div>
        
        <div className="flex-1 bg-neutral-900/40 rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-400">Failed to load points history</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {!hideTotalEvents && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-neutral-500">
            {history?.pagination.total || allEvents.length} total events
          </div>
        </div>
      )}
      
      <div className="bg-neutral-900/40 rounded overflow-hidden flex-1">
        <div className="h-full overflow-y-auto scrollable-container" ref={scrollRef} onScroll={handleScroll}>
          {!isLoading && allEvents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-xs text-neutral-500">No points history available</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              {/* Table Header */}
              <thead className="sticky top-0 bg-neutral-800/95 backdrop-blur-sm border-b border-white/[0.1] z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[15%]">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[20%]">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[35%]">Description</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[15%]">Order #</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-neutral-300 w-[15%]">Points</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody>
                {allEvents.map((event, index) => (
                  <HistoryEventItem key={`${event.id}-${index}`} event={event} />
                ))}
                
                {/* Loading more indicator */}
                {loadingMore && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-xs text-neutral-500">Loading more...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* End of list indicator */}
                {!hasMore && allEvents.length > 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center">
                      <span className="text-xs text-neutral-600">End of history</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};


