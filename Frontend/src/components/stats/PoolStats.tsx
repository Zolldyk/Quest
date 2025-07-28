'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
import {
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useStakingPool, useQuestManager, useNFTMinter, formatTokenAmount } from '../../hooks/useContracts';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

// ============ Types ============
interface PoolStatistics {
  totalPoolBalance: string;
  totalStakers: number;
  totalRewardsDistributed: string;
  averageStakeAmount: string;
  totalQuests: number;
  activeQuests: number;
  totalSubmissions: number;
  completedSubmissions: number;
  totalNFTsMinted: number;
  poolUtilizationRate: number;
  successRate: number;
}


/**
 * @title PoolStats
 * @notice Comprehensive statistics dashboard for Quest dApp ecosystem
 * @dev Displays real-time metrics and analytics for the entire platform
 */
export default function PoolStats() {

  // ============ Hooks ============
  const { 
    poolBalance,
    poolStats,
    refetchPoolBalance,
    refetchPoolStats 
  } = useStakingPool();
  
  const { 
    activeQuests,
    // Note: Would need additional functions for getting total submissions, etc.
  } = useQuestManager();
  
  const { 
    totalSupply 
  } = useNFTMinter();

  // ============ State ============
  const [statistics, setStatistics] = useState<PoolStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ============ Effects ============

  // Calculate comprehensive statistics
  useEffect(() => {
    const calculateStatistics = async () => {
      setIsLoading(true);

      try {
        // Base pool data
        const totalPoolBalance = formatTokenAmount(poolBalance, 6);
        const totalStakers = Number(poolStats?.[1]) || 0;
        const totalRewardsDistributed = formatTokenAmount(poolStats?.[2], 6);
        
        // Calculate derived metrics
        const averageStakeAmount = totalStakers > 0 
          ? (parseFloat(totalPoolBalance) / totalStakers).toFixed(2)
          : '0';

        const totalQuests = 10; // Mock data - would get from contract/subgraph
        const activeQuestsCount = (activeQuests as unknown as any[])?.length || 0;
        const totalSubmissions = 50; // Mock data
        const completedSubmissions = 35; // Mock data
        const totalNFTsMinted = Number(totalSupply) || 0;
        
        const poolUtilizationRate = parseFloat(totalPoolBalance) > 0 
          ? (parseFloat(totalRewardsDistributed) / parseFloat(totalPoolBalance)) * 100
          : 0;
          
        const successRate = totalSubmissions > 0 
          ? (completedSubmissions / totalSubmissions) * 100 
          : 0;

        const stats: PoolStatistics = {
          totalPoolBalance,
          totalStakers,
          totalRewardsDistributed,
          averageStakeAmount,
          totalQuests,
          activeQuests: activeQuestsCount,
          totalSubmissions,
          completedSubmissions,
          totalNFTsMinted,
          poolUtilizationRate,
          successRate,
        };

        setStatistics(stats);
        setLastUpdated(new Date());

      } catch (error) {
        console.error('Error calculating statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateStatistics();
  }, [poolBalance, poolStats, activeQuests, totalSupply]);

  // ============ Computed Values ============
  
  // Mock trend data - in production, this would come from historical data
  const trendData = useMemo(() => ({
    poolBalance: { change: 12.5, isPositive: true },
    stakers: { change: 8.3, isPositive: true },
    rewards: { change: 15.7, isPositive: true },
    successRate: { change: -2.1, isPositive: false },
  }), []);

  // ============ Handlers ============
  
  const handleRefreshStats = async () => {
    setIsLoading(true);
    try {
      await Promise.all([refetchPoolBalance(), refetchPoolStats()]);
      setLastUpdated(new Date());
      toast.success('Pool statistics refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Failed to refresh statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Loading State ============
  if (isLoading && !statistics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // ============ JSX Return ============
  return (
    <div className="w-full">{/* Removed unnecessary max-width and padding for sidebar usage */}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
        <button
          onClick={handleRefreshStats}
          disabled={isLoading}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" className="mr-1" />
          ) : (
            <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
          )}
          Refresh
        </button>
      </div>

      {/* Key Metrics - Compact Layout */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Pool Balance</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-green-600">
              {statistics?.totalPoolBalance || '0'} USDC
            </div>
            <div className="text-xs text-gray-500">
              {trendData.poolBalance.isPositive ? '↗' : '↘'} {Math.abs(trendData.poolBalance.change)}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Total Stakers</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-blue-600">
              {statistics?.totalStakers?.toString() || '0'}
            </div>
            <div className="text-xs text-gray-500">
              {trendData.stakers.isPositive ? '↗' : '↘'} {Math.abs(trendData.stakers.change)}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center">
            <TrophyIcon className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Rewards Paid</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-purple-600">
              {statistics?.totalRewardsDistributed || '0'} USDC
            </div>
            <div className="text-xs text-gray-500">
              {trendData.rewards.isPositive ? '↗' : '↘'} {Math.abs(trendData.rewards.change)}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-4 w-4 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Success Rate</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-orange-600">
              {(statistics?.successRate ?? 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {trendData.successRate.isPositive ? '↗' : '↘'} {Math.abs(trendData.successRate.change)}%
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <StarIcon className="h-4 w-4 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-purple-600">
            {statistics?.totalNFTsMinted || 0}
          </div>
          <div className="text-xs text-gray-600">NFT Badges</div>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <TrophyIcon className="h-4 w-4 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-600">
            {statistics?.completedSubmissions || 0}
          </div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">System Health</span>
          </div>
          <div className="text-right">
            <div className="text-lg">
              {(statistics?.poolUtilizationRate ?? 0) < 80 ? '🟢' : (statistics?.poolUtilizationRate ?? 0) < 95 ? '🟡' : '🔴'}
            </div>
            <div className="text-xs text-gray-600">
              {(statistics?.poolUtilizationRate ?? 0) < 80 ? 'Healthy' : 
               (statistics?.poolUtilizationRate ?? 0) < 95 ? 'Moderate' : 'High Usage'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Removed unused StatCard and MetricRow components for cleaner sidebar layout