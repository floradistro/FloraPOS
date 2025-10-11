import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsService } from '../services/rewards-service';
import { 
  UserPointsBalance, 
  UserPointsHistory, 
  RedemptionCalculation, 
  RedemptionResult,
  RewardsSettings
} from '../types/rewards';

interface AdjustPointsRequest {
  points: number;
  description: string;
}

const REWARDS_QUERY_KEYS = {
  balance: (userId: number) => ['rewards', 'balance', userId],
  history: (userId: number, page: number, perPage: number) => 
    ['rewards', 'history', userId, page, perPage],
  settings: () => ['rewards', 'settings'],
};

export const useUserPointsBalance = (userId: number) => {
  return useQuery<UserPointsBalance>({
    queryKey: REWARDS_QUERY_KEYS.balance(userId),
    queryFn: () => rewardsService.getUserBalance(userId),
    enabled: !!userId && userId > 0,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: false, // Don't auto-refetch, rely on invalidation
    retry: 1, // Only retry once for faster error handling
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export const useUserPointsHistory = (
  userId: number, 
  page: number = 1, 
  perPage: number = 20
) => {
  return useQuery<UserPointsHistory>({
    queryKey: REWARDS_QUERY_KEYS.history(userId, page, perPage),
    queryFn: () => rewardsService.getUserHistory(userId, page, perPage),
    enabled: !!userId,
    retry: 1,
  });
};

export const useRewardsSettings = () => {
  return useQuery<RewardsSettings>({
    queryKey: REWARDS_QUERY_KEYS.settings(),
    queryFn: () => rewardsService.getSettings(),
  });
};

export const useAdjustUserPoints = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; new_balance: number },
    Error,
    { userId: number; request: AdjustPointsRequest }
  >({
    mutationFn: async ({ userId, request }) => {
      return rewardsService.adjustUserPoints(
        userId,
        request.points,
        request.description
      );
    },
    onSuccess: (_, { userId }) => {
      // Force immediate refresh of both balance and history
      queryClient.invalidateQueries({ 
        queryKey: REWARDS_QUERY_KEYS.balance(userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['rewards', 'history', userId] 
      });
      
      // Force immediate refetch to show changes instantly
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: ['rewards', 'history', userId]
        });
      }, 100);
    },
  });
};

export const useCalculateRedemption = () => {
  return useMutation<
    RedemptionCalculation,
    Error,
    { userId: number; points: number }
  >({
    mutationFn: async ({ userId, points }) => {
      return rewardsService.calculateRedemption(userId, points);
    },
  });
};

export const useApplyRedemption = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RedemptionResult,
    Error,
    { userId: number; points: number; cartTotal: number }
  >({
    mutationFn: async ({ userId, points, cartTotal }) => {
      return rewardsService.applyRedemption(userId, points, cartTotal);
    },
    onSuccess: (_, { userId }) => {
      // Refresh user balance after redemption
      queryClient.invalidateQueries({ 
        queryKey: REWARDS_QUERY_KEYS.balance(userId) 
      });
      // Refresh history to show redemption
      queryClient.invalidateQueries({ 
        queryKey: ['rewards', 'history', userId] 
      });
    },
  });
};

// Hook for managing redemption calculations with debouncing
export const useRedemptionCalculator = (userId: number) => {
  const [points, setPoints] = useState<number>(0);
  const [calculation, setCalculation] = useState<RedemptionCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateMutation = useCalculateRedemption();

  useEffect(() => {
    if (points > 0 && userId) {
      setIsCalculating(true);
      
      const timer = setTimeout(async () => {
        try {
          const result = await calculateMutation.mutateAsync({ userId, points });
          setCalculation(result);
        } catch (error) {
          console.error('Failed to calculate redemption:', error);
          setCalculation(null);
        } finally {
          setIsCalculating(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    } else {
      setCalculation(null);
      setIsCalculating(false);
    }
  }, [points, userId, calculateMutation]);

  return {
    points,
    setPoints,
    calculation,
    isCalculating,
    error: calculateMutation.error,
  };
};

// Utility hook for formatting points values
export const usePointsFormatter = () => {
  const { data: settings } = useRewardsSettings();

  const formatPoints = (points: number): string => {
    if (!settings) return `${points} Points`;
    
    const [singular, plural] = settings.points_label.split(':') || ['Point', 'Points'];
    return `${points.toLocaleString()} ${points === 1 ? singular : plural}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return { formatPoints, formatCurrency, settings };
};


