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

const HistoryEventCard: React.FC<HistoryEventItemProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatEventType = (type: string) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isPositive = event.points > 0;

  const eventDescription = event.description?.trim() || `${event.type.replace('-', ' ')} transaction`;

  return (
    <div className="rounded-lg overflow-hidden p-2 cursor-pointer transition-all duration-300 ease-out border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-neutral-600/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-700/20">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Date */}
        <div className="col-span-2">
          <span className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
            {event.formatted_date || formatDate(event.date)}
          </span>
        </div>
        
        {/* Type */}
        <div className="col-span-2">
          <span className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
            {formatEventType(event.type)}
          </span>
        </div>
        
        {/* Description */}
        <div className="col-span-4">
          <div className="text-neutral-200 font-normal text-base mb-1 truncate" style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.3)' }} title={eventDescription}>
            {eventDescription}
          </div>
          {event.description?.trim() && event.description.trim() !== `${event.type.replace('-', ' ')} transaction` && (
            <div className="text-xs text-neutral-500 italic" style={{ fontFamily: 'Tiempo, serif' }}>
              {event.type === 'manual-adjust' ? 'Reason: ' : 'Details: '}{event.description.trim()}
            </div>
          )}
        </div>
        
        {/* Order # */}
        <div className="col-span-2">
          <span className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
            {event.order_id ? `#${event.order_id}` : 'N/A'}
          </span>
        </div>
        
        {/* Points */}
        <div className="col-span-2 text-right">
          <span className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>
            {isPositive ? '+' : ''}{event.points.toLocaleString()} pts
          </span>
        </div>
      </div>
    </div>
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
        
        <div className="flex-1 bg-transparent border border-neutral-600/30 rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>Loading points history...</p>
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
        
        <div className="flex-1 bg-transparent border border-neutral-600/30 rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-400" style={{ fontFamily: 'Tiempo, serif' }}>Failed to load points history</p>
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
          <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {history?.pagination.total || allEvents.length} total events
          </div>
        </div>
      )}
      
      <div className="flex-1">
        <div className="h-full overflow-y-auto scrollable-container" ref={scrollRef} onScroll={handleScroll}>
          {!isLoading && allEvents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>No points history available</p>
            </div>
          ) : (
            <div className="h-full overflow-auto p-4">
              {/* Header */}
              <div className="mb-6">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider" style={{ fontFamily: 'Tiempo, serif' }}>
                  <div className="col-span-2 text-left">Date</div>
                  <div className="col-span-2 text-left">Type</div>
                  <div className="col-span-4 text-left">Description</div>
                  <div className="col-span-2 text-left">Order #</div>
                  <div className="col-span-2 text-right">Points</div>
                </div>
              </div>
              
              {/* Event Cards */}
              <div className="space-y-2">
                {allEvents.map((event, index) => (
                  <HistoryEventCard key={`${event.id}-${index}`} event={event} />
                ))}
                
                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="py-4 text-center">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>Loading more...</span>
                    </div>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && allEvents.length > 0 && (
                  <div className="py-2 text-center">
                    <span className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempo, serif' }}>End of history</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


