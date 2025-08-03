'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
// import { toast } from 'react-hot-toast'; // Removed for cleaner error handling
import { 
  CurrencyDollarIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAddress } from '../../hooks/useThirdwebV5';
import { useStakingPool, useUSDCToken, formatTokenAmount, parseTokenAmount } from '../../hooks/useContracts';
import WalletConnectionV5 from '../wallet/WalletConnectionV5';
import LoadingSpinner from '../ui/LoadingSpinner';

// ============ Types ============
interface StakingStats {
  totalPoolBalance: string;
  totalStakers: number;
  totalRewards: string;
  minimumStake: string;
  userStaked: string;
  userBalance: string;
}

/**
 * @title StakingInterface
 * @notice Main interface for staking and unstaking USDC tokens
 * @dev Provides user-friendly staking functionality with real-time updates
 */
export default function StakingInterface() {
  
  // ============ Hooks ============
  const address = useAddress();
  const { 
    poolBalance, 
    poolStats, 
    isStaking, 
    isUnstaking,
    getStakerInfo,
    stakeTokens,
    unstakeTokens,
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
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [justCompleted, setJustCompleted] = useState<'approve' | 'stake' | null>(null);

  // ============ Constants ============
  const STAKING_POOL_ADDRESS = process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS!.trim();
  const USDC_DECIMALS = 6; // USDC has 6 decimals

  // ============ Effects ============
  
  // Fetch user data when address changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) {
        setStats(null);
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      
      try {
        // Initialize default values
        let usdcBalance = BigInt(0);
        let stakerInfo = null;
        let currentAllowance = BigInt(0);

        // Get user's USDC balance with error handling
        try {
          const balance = await getUSDCBalance(address);
          if (balance) usdcBalance = balance;
        } catch (error) {
          console.warn('Failed to fetch USDC balance:', error);
        }
        
        // Get user's staking info with error handling
        try {
          stakerInfo = await getStakerInfo(address);
        } catch (error) {
          console.warn('Failed to fetch staker info:', error);
        }
        
        // Get allowance with error handling
        try {
          console.log('Fetching allowance for:', { 
            address, 
            stakingPool: STAKING_POOL_ADDRESS,
            stakingPoolLength: STAKING_POOL_ADDRESS.length 
          });
          const allowance = await getAllowance(address, STAKING_POOL_ADDRESS);
          if (allowance !== null && allowance !== undefined) {
            currentAllowance = allowance;
          }
          console.log('Allowance fetched successfully:', {
            allowance: allowance?.toString(),
            currentAllowance: currentAllowance.toString()
          });
        } catch (error) {
          console.warn('Failed to fetch allowance:', error);
        }
        
        // Format stats with better error handling
        console.log('Pool stats received:', { 
          poolBalance: poolBalance?.toString(), 
          poolStats, 
          poolStatsType: typeof poolStats,
          poolStatsLength: Array.isArray(poolStats) ? poolStats.length : 'not array'
        });
        
        const newStats: StakingStats = {
          totalPoolBalance: formatTokenAmount(poolBalance || BigInt(0), USDC_DECIMALS),
          totalStakers: (poolStats && Array.isArray(poolStats) && poolStats.length >= 2) ? Number(poolStats[1]) : 0,
          totalRewards: formatTokenAmount((poolStats && Array.isArray(poolStats) && poolStats.length >= 3) ? (poolStats[2] as bigint) : BigInt(0), USDC_DECIMALS),
          minimumStake: formatTokenAmount((poolStats && Array.isArray(poolStats) && poolStats.length >= 4) ? (poolStats[3] as bigint) : BigInt(1000000), USDC_DECIMALS), // Default to 1 USDC minimum
          userStaked: formatTokenAmount(stakerInfo?.stakedAmount || BigInt(0), USDC_DECIMALS),
          userBalance: formatTokenAmount(usdcBalance, USDC_DECIMALS),
        };
        
        console.log('Formatted stats:', newStats);

        setStats(newStats);
        setAllowance(currentAllowance);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Set default stats to prevent complete failure
        setStats({
          totalPoolBalance: '0',
          totalStakers: 0,
          totalRewards: '0',
          minimumStake: '0',
          userStaked: '0',
          userBalance: '0',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [address, poolBalance, poolStats, getUSDCBalance, getStakerInfo, getAllowance, STAKING_POOL_ADDRESS]);

  // Check if approval is needed when stake amount changes
  useEffect(() => {
    if (stakeAmount) {
      const stakeAmountBN = parseTokenAmount(stakeAmount, USDC_DECIMALS);
      setNeedsApproval(allowance < stakeAmountBN);
    } else {
      setNeedsApproval(false);
    }
  }, [stakeAmount, allowance]);

  // ============ Computed Values ============
  
  const canStake = useMemo(() => {
    if (!stakeAmount || !stats) return false;
    const amount = parseFloat(stakeAmount);
    const balance = parseFloat(stats.userBalance);
    const minimum = parseFloat(stats.minimumStake);
    return amount > 0 && amount >= minimum && amount <= balance;
  }, [stakeAmount, stats]);

  const canUnstake = useMemo(() => {
    if (!unstakeAmount || !stats) return false;
    const amount = parseFloat(unstakeAmount);
    const staked = parseFloat(stats.userStaked);
    return amount > 0 && amount <= staked;
  }, [unstakeAmount, stats]);

  // ============ Handlers ============
  
  const handleApprove = async () => {
    if (!stakeAmount) return;
    
    try {
      const amount = parseTokenAmount(stakeAmount, USDC_DECIMALS);
      
      // Wait for approval transaction to complete
      await approveSpender(STAKING_POOL_ADDRESS, amount);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh allowance after successful approval
      const newAllowance = await getAllowance(address!, STAKING_POOL_ADDRESS);
      setAllowance(newAllowance || BigInt(0));
      
      console.log('Approval completed:', {
        approvedAmount: amount.toString(),
        newAllowance: newAllowance?.toString()
      });
      
      // Show success feedback briefly
      setJustCompleted('approve');
      setTimeout(() => setJustCompleted(null), 2000);
      
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleStake = async () => {
    if (!canStake || !stakeAmount) return;
    
    try {
      const amount = parseTokenAmount(stakeAmount, USDC_DECIMALS);
      
      // Execute staking transaction
      await stakeTokens(amount);
      
      // Reset form after successful stake
      setStakeAmount('');
      
      // Show success feedback briefly
      setJustCompleted('stake');
      setTimeout(() => setJustCompleted(null), 2000);
      
      // Add delay and refresh data after successful transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        await Promise.all([
          refetchPoolBalance(),
          refetchPoolStats()
        ]);
      } catch (error) {
        console.warn('Failed to refresh data after staking:', error);
      }
      
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  const handleUnstake = async () => {
    if (!canUnstake || !unstakeAmount) return;
    
    try {
      const amount = parseTokenAmount(unstakeAmount, USDC_DECIMALS);
      await unstakeTokens(amount);
      
      // Reset form and refresh data
      setUnstakeAmount('');
      await Promise.all([
        refetchPoolBalance(),
        refetchPoolStats()
      ]);
      
    } catch (error) {
      console.error('Unstaking failed:', error);
    }
  };

  const handleMaxStake = () => {
    if (stats) {
      setStakeAmount(stats.userBalance);
    }
  };

  const handleMaxUnstake = () => {
    if (stats) {
      setUnstakeAmount(stats.userStaked);
    }
  };

  // ============ JSX Return ============
  
  // Check if wallet is connected
  if (!address) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-6">Connect your wallet to access staking features</p>
        <WalletConnectionV5 variant="default" />
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staking Pool</h1>
          <p className="text-gray-600">
            Stake USDC to fund quest rewards and support the community
          </p>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Pool Statistics */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <CurrencyDollarIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Pool Statistics</h2>
                {isLoadingData && (
                  <div className="ml-auto">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <StatItem
                  label="Total Pool Balance"
                  value={`${stats?.totalPoolBalance || '0'} USDC`}
                  icon={<div className="w-2 h-2 bg-green-400 rounded-full" />}
                  isLoading={isLoadingData}
                />
                <StatItem
                  label="Total Stakers"
                  value={stats?.totalStakers.toString() || '0'}
                  icon={<div className="w-2 h-2 bg-blue-400 rounded-full" />}
                  isLoading={isLoadingData}
                />
                <StatItem
                  label="Rewards Distributed"
                  value={`${stats?.totalRewards || '0'} USDC`}
                  icon={<div className="w-2 h-2 bg-purple-400 rounded-full" />}
                  isLoading={isLoadingData}
                />
                <StatItem
                  label="Minimum Stake"
                  value={`${stats?.minimumStake || '0'} USDC`}
                  icon={<InformationCircleIcon className="h-4 w-4 text-gray-400" />}
                  isLoading={isLoadingData}
                />
              </div>

              {/* User Stats */}
              {stats && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Your Position</h3>
                  <div className="space-y-2">
                    <StatItem
                      label="Your Stake"
                      value={`${stats.userStaked} USDC`}
                      highlight={parseFloat(stats.userStaked) > 0}
                      isLoading={isLoadingData}
                    />
                    <StatItem
                      label="Available Balance"
                      value={`${stats.userBalance} USDC`}
                      isLoading={isLoadingData}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Staking Interface */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
              {/* Tab Navigation */}
              <div className="flex mb-6">
                <button
                  onClick={() => setActiveTab('stake')}
                  className={`flex-1 py-3 px-4 text-center font-medium rounded-l-lg border-2 transition-colors ${
                    activeTab === 'stake'
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <ArrowUpIcon className="h-4 w-4 inline mr-2" />
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab('unstake')}
                  className={`flex-1 py-3 px-4 text-center font-medium rounded-r-lg border-2 border-l-0 transition-colors ${
                    activeTab === 'unstake'
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <ArrowDownIcon className="h-4 w-4 inline mr-2" />
                  Unstake
                </button>
              </div>

              {/* Stake Tab */}
              {activeTab === 'stake' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Stake (USDC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-20"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <button
                        onClick={handleMaxStake}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-primary-600 hover:text-primary-800 font-medium"
                      >
                        MAX
                      </button>
                    </div>
                    {stats && stakeAmount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {stats.userBalance} USDC | Minimum: {stats.minimumStake} USDC
                      </p>
                    )}
                  </div>

                  {/* Validation Messages */}
                  {stakeAmount && stats && (
                    <div className="text-sm">
                      {parseFloat(stakeAmount) > parseFloat(stats.userBalance) && (
                        <p className="text-red-600 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Insufficient balance
                        </p>
                      )}
                      {parseFloat(stakeAmount) < parseFloat(stats.minimumStake) && parseFloat(stakeAmount) > 0 && (
                        <p className="text-yellow-600 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Below minimum stake amount
                        </p>
                      )}
                      {canStake && (
                        <p className="text-green-600 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Ready to stake
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status Information */}
                  {needsApproval && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium">Approval Required:</p>
                          <p>You need to approve the contract to spend your USDC tokens first.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!needsApproval && stakeAmount && allowance > BigInt(0) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-xs text-green-800">
                          <p className="font-medium">Ready to Stake:</p>
                          <p>Your approval is sufficient. You can now stake your tokens.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {needsApproval && (
                      <button
                        onClick={handleApprove}
                        disabled={!canStake || isApproving}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {isApproving ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Processing Transaction...
                          </>
                        ) : justCompleted === 'approve' ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Approved Successfully!
                          </>
                        ) : (
                          `Approve ${stakeAmount} USDC`
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={handleStake}
                      disabled={!canStake || needsApproval || isStaking}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {isStaking ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Processing Transaction...
                        </>
                      ) : justCompleted === 'stake' ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Staked Successfully!
                        </>
                      ) : (
                        <>
                          <ArrowUpIcon className="h-4 w-4 mr-2" />
                          Stake USDC
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Unstake Tab */}
              {activeTab === 'unstake' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Unstake (USDC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-20"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <button
                        onClick={handleMaxUnstake}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-primary-600 hover:text-primary-800 font-medium"
                      >
                        MAX
                      </button>
                    </div>
                    {stats && (
                      <p className="text-xs text-gray-500 mt-1">
                        Your stake: {stats.userStaked} USDC
                      </p>
                    )}
                  </div>

                  {/* Validation Messages */}
                  {unstakeAmount && stats && (
                    <div className="text-sm">
                      {parseFloat(unstakeAmount) > parseFloat(stats.userStaked) && (
                        <p className="text-red-600 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Amount exceeds your stake
                        </p>
                      )}
                      {canUnstake && (
                        <p className="text-green-600 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Ready to unstake
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleUnstake}
                    disabled={!canUnstake || isUnstaking}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isUnstaking ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Unstaking...
                      </>
                    ) : (
                      <>
                        <ArrowDownIcon className="h-4 w-4 mr-2" />
                        Unstake USDC
                      </>
                    )}
                  </button>

                  {/* Unstaking Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Instant Unstaking</p>
                        <p>
                          You can unstake your tokens at any time without penalties. 
                          Unstaked tokens will be returned to your wallet immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-12 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            How Staking Works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Stake USDC</h4>
              <p className="text-gray-600 text-sm">
                Deposit USDC tokens into the shared pool to fund quest rewards
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Fund Rewards</h4>
              <p className="text-gray-600 text-sm">
                Your staked tokens fund rewards for players completing quests
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Support Community</h4>
              <p className="text-gray-600 text-sm">
                Help grow the ecosystem and enable more quest opportunities
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Staking helps fund community rewards. You can unstake at any time 
              without penalties. Future versions may include staking rewards.
            </p>
          </div>
        </div>
      </div>
  );
}

// ============ Utility Components ============

interface StatItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  isLoading?: boolean;
}

function StatItem({ label, value, icon, highlight = false, isLoading = false }: StatItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      {isLoading ? (
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
      ) : (
        <span className={`font-semibold ${highlight ? 'text-primary-600' : 'text-gray-900'}`}>
          {value}
        </span>
      )}
    </div>
  );
}

// ============ Loading Spinner Component ============
// Create this in a separate file: src/components/ui/LoadingSpinner.tsx