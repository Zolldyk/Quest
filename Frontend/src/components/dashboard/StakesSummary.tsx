'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { useStakingPool, useUSDCToken, formatTokenAmount, StakerInfo, PoolStats } from '../../hooks/useContracts';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';
// import { toast } from 'react-hot-toast'; // Removed for cleaner error handling

// ============ Types ============
interface StakingData {
  stakerInfo: StakerInfo | null;
  poolStats: PoolStats | null;
  userBalance: string;
  stakingShare: number;
  stakingHistory: StakingEvent[];
}

interface StakingEvent {
  type: 'stake' | 'unstake';
  amount: string;
  timestamp: number;
  txHash?: string;
}

/**
 * @title StakesSummary
 * @notice Comprehensive staking overview component for user dashboard
 * @dev Shows detailed staking information, history, and quick actions
 */
export default function StakesSummary() {

  // ============ Hooks ============
  const address = useAddress();
  const { 
    poolBalance,
    poolStats,
    getStakerInfo,
    stakeTokens,
    unstakeTokens,
    isStaking,
    isUnstaking,
    refetchPoolBalance,
    refetchPoolStats 
  } = useStakingPool();

  const { 
    getBalance: getUSDCBalance,
    getAllowance,
    approveSpender,
    isApproving 
  } = useUSDCToken();

  // ============ State ============
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickAction, setQuickAction] = useState<'stake' | 'unstake'>('stake');
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));

  // ============ Constants ============
  const STAKING_POOL_ADDRESS = process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS!;
  const USDC_DECIMALS = 6;

  // ============ Effects ============

  // Memoize stable references to prevent unnecessary re-renders
  const stakingPoolAddress = useMemo(() => STAKING_POOL_ADDRESS, []);

  // Fetch staking data when address or pool data changes
  useEffect(() => {
    const fetchStakingData = async () => {
      if (!address) {
        setStakingData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Initialize default values
        let stakerInfo = null;
        let usdcBalance = BigInt(0);
        let currentAllowance = BigInt(0);

        // Get user's staking info with error handling
        try {
          stakerInfo = await getStakerInfo(address);
        } catch (error) {
          console.warn('Failed to fetch staker info:', error);
        }
        
        // Get user's USDC balance with error handling
        try {
          const balance = await getUSDCBalance(address);
          if (balance) usdcBalance = balance;
        } catch (error) {
          console.warn('Failed to fetch USDC balance:', error);
        }
        
        // Get allowance with error handling
        try {
          const allowance = await getAllowance(address, stakingPoolAddress);
          if (allowance) currentAllowance = allowance;
        } catch (error) {
          console.warn('Failed to fetch allowance:', error);
        }
        
        // Calculate staking share
        const totalPool = poolBalance || BigInt(0);
        const userStaked = stakerInfo?.stakedAmount || BigInt(0);
        const stakingShare = totalPool > BigInt(0) 
          ? (Number(userStaked) / Number(totalPool)) * 100 
          : 0;

        // Mock staking history (in production, get from subgraph/events)
        const mockHistory: StakingEvent[] = stakerInfo?.isActive ? [
          {
            type: 'stake',
            amount: formatTokenAmount(stakerInfo.stakedAmount, USDC_DECIMALS),
            timestamp: Number(stakerInfo.stakeTimestamp) * 1000,
          }
        ] : [];

        const data: StakingData = {
          stakerInfo,
          poolStats: poolStats ? {
            totalPoolBalance: poolStats[0],
            totalStakers: poolStats[1], 
            totalRewardsDistributed: poolStats[2],
            minimumStakeAmount: poolStats[3],
          } : null,
          userBalance: formatTokenAmount(usdcBalance, USDC_DECIMALS),
          stakingShare,
          stakingHistory: mockHistory,
        };

        setStakingData(data);
        setAllowance(currentAllowance);

      } catch (error) {
        console.error('Error fetching staking data:', error);
        // Don't show error toast, let the component handle empty state gracefully
        setStakingData({
          stakerInfo: null,
          poolStats: null,
          userBalance: '0',
          stakingShare: 0,
          stakingHistory: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingData();
  }, [address, poolBalance, poolStats, stakingPoolAddress, getStakerInfo, getUSDCBalance, getAllowance]);

  // ============ Computed Values ============
  const needsApproval = useMemo(() => {
    if (!quickAmount || quickAction !== 'stake') return false;
    const amount = parseFloat(quickAmount);
    const allowanceAmount = parseFloat(formatTokenAmount(allowance, USDC_DECIMALS));
    return amount > allowanceAmount;
  }, [quickAmount, quickAction, allowance]);

  const canExecuteAction = useMemo(() => {
    if (!quickAmount || !stakingData) return false;
    const amount = parseFloat(quickAmount);
    
    if (quickAction === 'stake') {
      const balance = parseFloat(stakingData.userBalance);
      const minimum = parseFloat(formatTokenAmount(stakingData.poolStats?.minimumStakeAmount, USDC_DECIMALS));
      return amount > 0 && amount >= minimum && amount <= balance && !needsApproval;
    } else {
      const staked = parseFloat(formatTokenAmount(stakingData.stakerInfo?.stakedAmount, USDC_DECIMALS));
      return amount > 0 && amount <= staked;
    }
  }, [quickAmount, quickAction, stakingData, needsApproval]);

  // ============ Handlers ============
  const handleApprove = async () => {
    if (!quickAmount) return;
    
    try {
      const amount = BigInt(quickAmount) * BigInt(Math.pow(10, USDC_DECIMALS));
      await approveSpender(stakingPoolAddress, amount);
      
      // Refresh allowance
      const newAllowance = await getAllowance(address!, stakingPoolAddress);
      setAllowance(newAllowance || BigInt(0));
      
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleQuickAction = async () => {
    if (!canExecuteAction || !quickAmount) return;

    try {
      const amount = BigInt(quickAmount) * BigInt(Math.pow(10, USDC_DECIMALS));
      
      if (quickAction === 'stake') {
        await stakeTokens(amount);
      } else {
        await unstakeTokens(amount);
      }

      // Reset form and refresh data
      setQuickAmount('');
      await Promise.all([refetchPoolBalance(), refetchPoolStats()]);

    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };

  const handleMaxAmount = () => {
    if (!stakingData) return;
    
    if (quickAction === 'stake') {
      setQuickAmount(stakingData.userBalance);
    } else {
      setQuickAmount(formatTokenAmount(stakingData.stakerInfo?.stakedAmount, USDC_DECIMALS));
    }
  };

  const handleRefreshData = async () => {
    await Promise.all([refetchPoolBalance(), refetchPoolStats()]);
    // Trigger re-fetch of user data
    window.location.reload(); // Simple refresh for demo
  };

  // ============ Loading State ============
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  // ============ No Data State ============
  if (!stakingData) {
    return (
      <div className="text-center py-8">
        <CurrencyDollarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Staking Data
        </h3>
        <p className="text-gray-600">
          Unable to load your staking information
        </p>
      </div>
    );
  }

  // ============ JSX Return ============
  return (
    <div className="space-y-8">
      
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Staking Overview</h2>
        <button
          onClick={handleRefreshData}
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StakingStatCard
          title="Your Stake"
          value={`${formatTokenAmount(stakingData.stakerInfo?.stakedAmount, USDC_DECIMALS)} USDC`}
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          color="blue"
          subtitle={`${stakingData.stakingShare.toFixed(2)}% of pool`}
        />
        <StakingStatCard
          title="Available Balance"
          value={`${stakingData.userBalance} USDC`} 
          icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
          color="green"
          subtitle="Ready to stake"
        />
        <StakingStatCard
          title="Pool Share"
          value={`${stakingData.stakingShare.toFixed(4)}%`}
          icon={<ArrowTrendingDownIcon className="h-5 w-5" />}
          color="purple"
          subtitle="Of total pool"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Action Selection */}
          <div>
            <div className="flex mb-4">
              <button
                onClick={() => setQuickAction('stake')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-l-lg border-2 font-medium transition-colors text-sm sm:text-base ${
                  quickAction === 'stake'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Stake
              </button>
              <button
                onClick={() => setQuickAction('unstake')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-r-lg border-2 border-l-0 font-medium transition-colors text-sm sm:text-base ${
                  quickAction === 'unstake'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Unstake
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 sm:pr-16 text-sm sm:text-base"
                  placeholder={`Amount to ${quickAction}`}
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={handleMaxAmount}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  MAX
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {needsApproval && (
                  <button
                    onClick={handleApprove}
                    disabled={!quickAmount || isApproving}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                  >
                    {isApproving ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Approving...
                      </>
                    ) : (
                      `Approve ${quickAmount} USDC`
                    )}
                  </button>
                )}

                <button
                  onClick={handleQuickAction}
                  disabled={!canExecuteAction || needsApproval || isStaking || isUnstaking}
                  className={`w-full font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${
                    quickAction === 'stake'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white'
                  }`}
                >
                  {(isStaking || isUnstaking) ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="mr-2" />
                      {quickAction === 'stake' ? 'Staking...' : 'Unstaking...'}
                    </>
                  ) : (
                    <>
                      {quickAction === 'stake' ? (
                        <PlusIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <MinusIcon className="h-4 w-4 mr-2" />
                      )}
                      {quickAction === 'stake' ? 'Stake USDC' : 'Unstake USDC'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                {quickAction === 'stake' ? 'Staking Info' : 'Unstaking Info'}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {quickAction === 'stake' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Balance:</span>
                      <span className="font-medium">{stakingData.userBalance} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum Stake:</span>
                      <span className="font-medium">
                        {formatTokenAmount(stakingData.poolStats?.minimumStakeAmount, USDC_DECIMALS)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Allowance:</span>
                      <span className="font-medium">
                        {formatTokenAmount(allowance, USDC_DECIMALS)} USDC
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Stake:</span>
                      <span className="font-medium">
                        {formatTokenAmount(stakingData.stakerInfo?.stakedAmount, USDC_DECIMALS)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Staked Since:</span>
                      <span className="font-medium">
                        {stakingData.stakerInfo?.stakeTimestamp 
                          ? new Date(Number(stakingData.stakerInfo.stakeTimestamp) * 1000).toLocaleDateString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Instant Unstaking:</span>
                      <span className="font-medium text-green-600">✓ Available</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-blue-800">
                  {quickAction === 'stake' ? (
                    <div>
                      <p className="font-medium mb-1">Staking Benefits</p>
                      <p>Your staked USDC helps fund quest rewards and supports the community ecosystem.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium mb-1">Instant Unstaking</p>
                      <p>You can unstake your tokens at any time without penalties or waiting periods.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staking History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staking History</h3>
        
        {stakingData.stakingHistory.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No staking history yet</p>
            <p className="text-sm text-gray-400">Your staking transactions will appear here</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-4 text-sm font-medium text-gray-600">
                <span>Action</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Status</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {stakingData.stakingHistory.map((event, index) => (
                <StakingHistoryItem key={index} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pool Information */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Pool Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-blue-600 break-all">
              {formatTokenAmount(stakingData.poolStats?.totalPoolBalance, USDC_DECIMALS)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Total Pool Balance (USDC)</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {stakingData.poolStats?.totalStakers.toString()}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Total Stakers</p>
          </div>
          <div className="text-center space-y-1 sm:col-span-2 lg:col-span-1">
            <p className="text-xl sm:text-2xl font-bold text-purple-600 break-all">
              {formatTokenAmount(stakingData.poolStats?.totalRewardsDistributed, USDC_DECIMALS)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Rewards Distributed (USDC)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Staking Stat Card Component ============
interface StakingStatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
  subtitle?: string;
}

function StakingStatCard({ title, value, icon, color, subtitle }: StakingStatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center mb-2 space-x-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-base sm:text-xl font-bold ${colorClasses[color].split(' ')[0]} truncate`}>
            {value}
          </p>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
}

// ============ Staking History Item Component ============
interface StakingHistoryItemProps {
  event: StakingEvent;
}

function StakingHistoryItem({ event }: StakingHistoryItemProps) {
  const isStake = event.type === 'stake';
  
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-4 items-center text-sm">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            isStake ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="capitalize font-medium text-gray-900">
            {event.type}
          </span>
        </div>
        <span className={`font-medium ${
          isStake ? 'text-green-600' : 'text-red-600'
        }`}>
          {isStake ? '+' : '-'}{event.amount} USDC
        </span>
        <span className="text-gray-600">
          {new Date(event.timestamp).toLocaleDateString()}
        </span>
        <div className="flex items-center">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Completed
          </span>
        </div>
      </div>
    </div>
  );
}