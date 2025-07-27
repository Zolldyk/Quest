'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
import {
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useStakingPool, useQuestManager, useNFTMinter, formatTokenAmount } from '../../hooks/useContracts';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';

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

interface TrendData {
  value: number;
  change: number;
  isPositive: boolean;
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
    poolBalance: { value: parseFloat(statistics?.totalPoolBalance || '0'), change: 12.5, isPositive: true },
    stakers: { value: statistics?.totalStakers || 0, change: 8.3, isPositive: true },
    rewards: { value: parseFloat(statistics?.totalRewardsDistributed || '0'), change: 15.7, isPositive: true },
    successRate: { value: statistics?.successRate || 0, change: -2.1, isPositive: false },
  }), [statistics]);

  // ============ Handlers ============
  
  const handleRefreshStats = async () => {
    setIsLoading(true);
    await Promise.all([refetchPoolBalance(), refetchPoolStats()]);
    setLastUpdated(new Date());
    setIsLoading(false);
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
    <div className="max-w-7xl mx-auto p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pool Statistics</h1>
          <p className="text-gray-600">
            Real-time metrics and analytics for the Quest ecosystem
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefreshStats}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Pool Balance"
          value={`${statistics?.totalPoolBalance || '0'} USDC`}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          trend={trendData.poolBalance}
          color="green"
        />
        <StatCard
          title="Total Stakers"
          value={statistics?.totalStakers?.toString() || '0'}
          icon={<UsersIcon className="h-6 w-6" />}
          trend={trendData.stakers}
          color="blue"
        />
        <StatCard
          title="Rewards Distributed"
          value={`${statistics?.totalRewardsDistributed || '0'} USDC`}
          icon={<TrophyIcon className="h-6 w-6" />}
          trend={trendData.rewards}
          color="purple"
        />
        <StatCard
          title="Success Rate"
          value={`${(statistics?.successRate ?? 0).toFixed(1)}%`}
          icon={<ChartBarIcon className="h-6 w-6" />}
          trend={trendData.successRate}
          color="orange"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Pool Analytics */}
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Pool Analytics</h3>
          
          <div className="space-y-4">
            <MetricRow
              label="Average Stake Amount"
              value={`${statistics?.averageStakeAmount || '0'} USDC`}
              description="Average amount staked per user"
            />
            <MetricRow
              label="Pool Utilization Rate"
              value={`${(statistics?.poolUtilizationRate ?? 0).toFixed(1)}%`}
              description="Percentage of pool used for rewards"
            />
            <MetricRow
              label="Active Stakers"
              value={statistics?.totalStakers?.toString() || '0'}
              description="Users currently staking in the pool"
            />
            <MetricRow
              label="Available Balance"
              value={`${(parseFloat(statistics?.totalPoolBalance || '0') - parseFloat(statistics?.totalRewardsDistributed || '0')).toFixed(2)} USDC`}
              description="Remaining balance for future rewards"
            />
          </div>
        </div>

        {/* Quest Analytics */}
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quest Analytics</h3>
          
          <div className="space-y-4">
            <MetricRow
              label="Total Quests Created"
              value={statistics?.totalQuests?.toString() || '0'}
              description="All-time quest campaigns"
            />
            <MetricRow
              label="Active Quests"
              value={statistics?.activeQuests?.toString() || '0'}
              description="Currently available quests"
            />
            <MetricRow
              label="Total Submissions"
              value={statistics?.totalSubmissions?.toString() || '0'}
              description="All quest submissions received"
            />
            <MetricRow
              label="Completion Rate"
              value={`${(statistics?.successRate ?? 0).toFixed(1)}%`}
              description="Percentage of approved submissions"
            />
          </div>
        </div>
      </div>

      {/* NFT & Rewards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NFT Stats */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center mb-4">
            <StarIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">NFT Badges</h3>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {statistics?.totalNFTsMinted || 0}
            </div>
            <div className="text-sm text-gray-600">Total Badges Minted</div>
          </div>
        </div>

        {/* Quest Activity */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center mb-4">
            <TrophyIcon className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Quest Activity</h3>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {statistics?.completedSubmissions || 0}
            </div>
            <div className="text-sm text-gray-600">Quests Completed</div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {(statistics?.poolUtilizationRate ?? 0) < 80 ? '🟢' : (statistics?.poolUtilizationRate ?? 0) < 95 ? '🟡' : '🔴'}
            </div>
            <div className="text-sm text-gray-600">
              {(statistics?.poolUtilizationRate ?? 0) < 80 ? 'Healthy' : 
               (statistics?.poolUtilizationRate ?? 0) < 95 ? 'Moderate' : 'High Usage'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Stat Card Component ============
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: TrendData;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center text-sm font-medium ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? (
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
          )}
          {Math.abs(trend.change)}%
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
      </div>
      
      <div className="text-xs text-gray-500">
        {trend.isPositive ? 'Increased' : 'Decreased'} from last period
      </div>
    </div>
  );
}

// ============ Metric Row Component ============
interface MetricRowProps {
  label: string;
  value: string;
  description: string;
}

function MetricRow({ label, value, description }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <div className="font-bold text-gray-900">{value}</div>
    </div>
  );
}