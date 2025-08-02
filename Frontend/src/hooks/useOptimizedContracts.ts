'use client';

import { useMemo } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useContract, useContractRead } from './useThirdwebV5';
import { CONTRACT_ADDRESSES } from './useThirdwebV5';

// Cache for contract instances to avoid recreation
const contractCache = new Map();

// Optimized hook for contract data fetching with caching and error handling
export function useOptimizedContractRead(
  contractAddress: string,
  method: string,
  args?: any[],
  options?: {
    enabled?: boolean;
    cacheTime?: number;
    staleTime?: number;
  }
) {
  const { contract } = useContract(contractAddress);
  const account = useActiveAccount();
  
  const enabled = options?.enabled !== false && !!contract && !!account;
  
  const { data, isLoading, error, refetch } = useContractRead(
    contract,
    method,
    args
  );

  return useMemo(() => ({
    data,
    isLoading: isLoading && enabled,
    error: enabled ? error : null,
    refetch: enabled ? refetch : () => Promise.resolve(),
    isEnabled: enabled
  }), [data, isLoading, error, refetch, enabled]);
}

// Optimized hooks for specific contracts
export function useStakingPoolData() {
  const account = useActiveAccount();
  const isConnected = !!account;
  
  // Pool stats - always fetch
  const poolTotal = useOptimizedContractRead(
    CONTRACT_ADDRESSES.stakingPool,
    'getTotalStaked',
    [],
    { enabled: !!CONTRACT_ADDRESSES.stakingPool }
  );
  
  const poolBalance = useOptimizedContractRead(
    CONTRACT_ADDRESSES.stakingPool,
    'getBalance',
    [],
    { enabled: !!CONTRACT_ADDRESSES.stakingPool }
  );
  
  // User data - only fetch when connected
  const userStake = useOptimizedContractRead(
    CONTRACT_ADDRESSES.stakingPool,
    'getStake',
    [account?.address],
    { enabled: isConnected && !!CONTRACT_ADDRESSES.stakingPool }
  );

  return {
    poolStats: {
      total: poolTotal.data,
      balance: poolBalance.data,
      isLoading: poolTotal.isLoading || poolBalance.isLoading,
      error: poolTotal.error || poolBalance.error
    },
    userStake: {
      amount: userStake.data,
      isLoading: userStake.isLoading,
      error: userStake.error
    },
    refetch: () => {
      poolTotal.refetch();
      poolBalance.refetch();
      if (isConnected) userStake.refetch();
    }
  };
}

export function useQuestData() {
  const account = useActiveAccount();
  const isConnected = !!account;
  
  // Current quest data
  const currentQuest = useOptimizedContractRead(
    CONTRACT_ADDRESSES.questManager,
    'getCurrentQuest',
    [],
    { enabled: !!CONTRACT_ADDRESSES.questManager }
  );
  
  // User submission status - only when connected
  const userSubmission = useOptimizedContractRead(
    CONTRACT_ADDRESSES.questManager,
    'hasUserSubmitted',
    [account?.address],
    { enabled: isConnected && !!CONTRACT_ADDRESSES.questManager }
  );

  return {
    quest: {
      data: currentQuest.data,
      isLoading: currentQuest.isLoading,
      error: currentQuest.error
    },
    userStatus: {
      hasSubmitted: userSubmission.data,
      isLoading: userSubmission.isLoading,
      error: userSubmission.error
    },
    refetch: () => {
      currentQuest.refetch();
      if (isConnected) userSubmission.refetch();
    }
  };
}

export function useUserNFTs() {
  const account = useActiveAccount();
  const isConnected = !!account;
  
  const userNFTs = useOptimizedContractRead(
    CONTRACT_ADDRESSES.nftMinter,
    'getUserNFTs',
    [account?.address],
    { enabled: isConnected && !!CONTRACT_ADDRESSES.nftMinter }
  );

  return {
    nfts: userNFTs.data || [],
    isLoading: userNFTs.isLoading,
    error: userNFTs.error,
    refetch: userNFTs.refetch
  };
}

// Combined dashboard data hook
export function useDashboardData() {
  const stakingData = useStakingPoolData();
  const questData = useQuestData();
  const nftData = useUserNFTs();

  const isLoading = stakingData.poolStats.isLoading || 
                   stakingData.userStake.isLoading ||
                   questData.quest.isLoading ||
                   questData.userStatus.isLoading ||
                   nftData.isLoading;

  const hasError = stakingData.poolStats.error ||
                  stakingData.userStake.error ||
                  questData.quest.error ||
                  questData.userStatus.error ||
                  nftData.error;

  return {
    staking: stakingData,
    quest: questData,
    nfts: nftData,
    isLoading,
    hasError,
    refetchAll: () => {
      stakingData.refetch();
      questData.refetch();
      nftData.refetch();
    }
  };
}

// Contract cache utilities
export function clearContractCache() {
  contractCache.clear();
}

export function getCacheStats() {
  return {
    size: contractCache.size,
    keys: Array.from(contractCache.keys())
  };
}