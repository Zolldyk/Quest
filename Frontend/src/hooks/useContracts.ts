// ============ Imports ============
import { useContract, useContractRead, useContractWrite } from "../hooks/useThirdwebV5";
import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

// ============ Contract ABIs ============
const STAKING_POOL_ABI = [
  {
    "type": "function",
    "name": "stake",
    "inputs": [{"name": "amount", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unstake", 
    "inputs": [{"name": "amount", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getPoolBalance",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStakerInfo",
    "inputs": [{"name": "staker", "type": "address"}],
    "outputs": [
      {"name": "stakedAmount", "type": "uint256"},
      {"name": "stakeTimestamp", "type": "uint256"}, 
      {"name": "lastUpdateTime", "type": "uint256"},
      {"name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPoolStats", 
    "inputs": [],
    "outputs": [
      {"name": "totalPoolBalance", "type": "uint256"},
      {"name": "totalStakers", "type": "uint256"},
      {"name": "totalRewardsDistributed", "type": "uint256"},
      {"name": "minimumStakeAmount", "type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStakingToken",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "distributeReward",
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "replenishPool",
    "inputs": [{"name": "amount", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getQuestManager",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getConfig",
    "inputs": [],
    "outputs": [
      {"name": "stakingToken", "type": "address"},
      {"name": "questManager", "type": "address"},
      {"name": "minimumStakeAmount", "type": "uint256"},
      {"name": "emergencyWithdrawDelay", "type": "uint256"},
      {"name": "isPaused", "type": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unpause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "paused",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  }
] as const;

const NFT_MINTER_ABI = [
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "balanceOf",
    "inputs": [{"name": "owner", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI", 
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserBadges",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBadge",
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "components": [
        {"name": "questId", "type": "uint256"},
        {"name": "recipient", "type": "address"},
        {"name": "tweetUrl", "type": "string"},
        {"name": "mintTime", "type": "uint256"},
        {"name": "questReward", "type": "uint256"},
        {"name": "questTitle", "type": "string"},
        {"name": "isValid", "type": "bool"}
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserBadgeCount",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
] as const;

const ERC20_ABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
] as const;

const QUEST_MANAGER_ABI = [
  // ============ Custom Errors ============
  {
    "type": "error",
    "name": "QuestManager__InvalidAddress",
    "inputs": []
  },
  {
    "type": "error", 
    "name": "QuestManager__InvalidAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__QuestNotFound", 
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__QuestAlreadySubmitted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__QuestNotSubmitted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__QuestAlreadyCompleted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__QuestAlreadyRejected",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__Unauthorized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__EmptyTweetUrl",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__InvalidQuestId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__InsufficientPoolBalance",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__QuestNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__SubmissionWindowClosed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QuestManager__PlayerAlreadyCompleted",
    "inputs": []
  },
  // ============ Functions ============
  {
    "type": "function",
    "name": "submitQuest",
    "inputs": [
      {"name": "questId", "type": "uint256"},
      {"name": "tweetUrl", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", 
    "name": "verifyQuest",
    "inputs": [
      {"name": "submissionId", "type": "uint256"},
      {"name": "approved", "type": "bool"},
      {"name": "rejectionReason", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getQuest", 
    "inputs": [{"name": "questId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "questId", "type": "uint256"},
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "requirements", "type": "string"},
      {"name": "rewardAmount", "type": "uint256"},
      {"name": "isActive", "type": "bool"},
      {"name": "startTime", "type": "uint256"},
      {"name": "endTime", "type": "uint256"},
      {"name": "maxCompletions", "type": "uint256"},
      {"name": "currentCompletions", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "createTime", "type": "uint256"}
    ]}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSubmission",
    "inputs": [{"name": "submissionId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "questId", "type": "uint256"},
      {"name": "player", "type": "address"},
      {"name": "tweetUrl", "type": "string"},
      {"name": "submitTime", "type": "uint256"},
      {"name": "status", "type": "uint8"},
      {"name": "verifyTime", "type": "uint256"},
      {"name": "verifiedBy", "type": "address"},
      {"name": "nftTokenId", "type": "uint256"},
      {"name": "rejectionReason", "type": "string"}
    ]}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getActiveQuests",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "getPendingSubmissions",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPlayerSubmissions", 
    "inputs": [{"name": "player", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasPlayerCompletedQuest",
    "inputs": [
      {"name": "player", "type": "address"},
      {"name": "questId", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isAdmin",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDefaultQuestId", 
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "pure"
  }
] as const;


// ============ Types ============
export interface StakerInfo {
  stakedAmount: bigint;
  stakeTimestamp: bigint;
  lastUpdateTime: bigint;
  isActive: boolean;
}

export interface PoolStats {
  totalPoolBalance: bigint;
  totalStakers: bigint;
  totalRewardsDistributed: bigint;
  minimumStakeAmount: bigint;
}

export interface Quest {
  questId: bigint;
  title: string;
  description: string;
  requirements: string;
  rewardAmount: bigint;
  isActive: boolean;
  startTime: bigint;
  endTime: bigint;
  maxCompletions: bigint;
  currentCompletions: bigint;
  creator: string;
  createTime: bigint;
}

export interface QuestSubmission {
  questId: bigint;
  player: string;
  tweetUrl: string;
  submitTime: bigint;
  status: number; // 0: PENDING, 1: COMPLETED, 2: REJECTED
  verifyTime: bigint;
  verifiedBy: string;
  nftTokenId: bigint;
  rejectionReason: string;
}

export interface QuestBadge {
  questId: bigint;
  recipient: string;
  tweetUrl: string;
  mintTime: bigint;
  questReward: bigint;
  questTitle: string;
  isValid: boolean;
}

// ============ Contract Addresses ============
const getContractAddresses = () => {
  const addresses = {
    stakingPool: (process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS || '').trim(),
    questManager: (process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS || '').trim(),
    nftMinter: (process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS || '').trim(),
    usdcToken: (process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || '').trim(),
  };

  // Validate addresses (silently)
  const missingAddresses = Object.entries(addresses)
    .filter(([, value]) => !value || value.trim() === '' || value === 'undefined')
    .map(([key]) => key);

  if (missingAddresses.length > 0) {
    console.warn(`Missing contract addresses: ${missingAddresses.join(', ')}`);
  }

  return addresses;
};

// ============ Staking Pool Hooks ============

/**
 * Hook for interacting with StakingPool contract
 */
export function useStakingPool() {
  const { stakingPool } = getContractAddresses();
  
  // Contract instance
  const { contract } = useContract(stakingPool || '', STAKING_POOL_ABI);
  
  // Read functions
  const { data: poolBalance, refetch: refetchPoolBalance } = useContractRead(
    contract, "getPoolBalance"
  );
  
  const { data: poolStats, refetch: refetchPoolStats } = useContractRead(
    contract, "getPoolStats"
  );
  
  // Write functions
  const { mutateAsync: stake, isPending: isStaking } = useContractWrite(contract, "stake");
  const { mutateAsync: unstake, isPending: isUnstaking } = useContractWrite(contract, "unstake");
  
  // Admin functions
  const { mutateAsync: pauseContract, isPending: isPausing } = useContractWrite(contract, "pause");
  const { mutateAsync: unpauseContract, isPending: isUnpausing } = useContractWrite(contract, "unpause");
  
  // Read pause state and owner
  const { data: isPaused, refetch: refetchPauseState } = useContractRead(contract, "paused");
  const { data: contractOwner } = useContractRead(contract, "owner");
  
  // Helper functions with retry logic
  const getStakerInfo = useCallback(async (address: string, retries = 3): Promise<StakerInfo | null> => {
    if (!contract || !address || !stakingPool) return null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { readContract } = await import('thirdweb');
        const result = await readContract({
          contract,
          method: "getStakerInfo",
          params: [address]
        });
        
        // Handle case where thirdweb wraps result in {result: data}
        const actualResult = result && typeof result === 'object' && 'result' in result ? result.result : result;
        
        if (actualResult && Array.isArray(actualResult) && actualResult.length >= 4) {
          return {
            stakedAmount: actualResult[0] as bigint,
            stakeTimestamp: actualResult[1] as bigint,
            lastUpdateTime: actualResult[2] as bigint,
            isActive: actualResult[3] as boolean,
          };
        }
        
        return {
          stakedAmount: BigInt(0),
          stakeTimestamp: BigInt(0),
          lastUpdateTime: BigInt(0),
          isActive: false,
        };
      } catch (error) {
        console.warn(`StakingPool.getStakerInfo attempt ${attempt}/${retries} failed:`, error);
        if (attempt === retries) {
          console.error("Final attempt failed for getStakerInfo:", error);
          return {
            stakedAmount: BigInt(0),
            stakeTimestamp: BigInt(0),
            lastUpdateTime: BigInt(0),
            isActive: false,
          };
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return null;
  }, [contract, stakingPool]);

  const stakeTokens = useCallback(async (amount: bigint) => {
    if (!contract || !stakingPool) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await stake([amount]);
      toast.success("Tokens staked successfully!");
      
      // Refetch data
      await Promise.all([refetchPoolBalance(), refetchPoolStats()]);
      
      return tx;
    } catch (error: any) {
      console.error("Staking error:", error);
      toast.error(error?.message || "Failed to stake tokens");
      throw error;
    }
  }, [contract, stake, refetchPoolBalance, refetchPoolStats, stakingPool]);

  const unstakeTokens = useCallback(async (amount: bigint) => {
    if (!contract || !stakingPool) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await unstake([amount]);
      toast.success("Tokens unstaked successfully!");
      
      // Refetch data
      await Promise.all([refetchPoolBalance(), refetchPoolStats()]);
      
      return tx;
    } catch (error: any) {
      console.error("Unstaking error:", error);
      toast.error(error?.message || "Failed to unstake tokens");
      throw error;
    }
  }, [contract, unstake, refetchPoolBalance, refetchPoolStats, stakingPool]);

  const pauseStakingPool = useCallback(async () => {
    if (!contract || !stakingPool) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await pauseContract([]);
      toast.success("StakingPool paused successfully!");
      
      // Refetch pause state
      await refetchPauseState();
      
      return tx;
    } catch (error: any) {
      console.error("Pause error:", error);
      toast.error(error?.message || "Failed to pause contract");
      throw error;
    }
  }, [contract, pauseContract, refetchPauseState, stakingPool]);

  const unpauseStakingPool = useCallback(async () => {
    if (!contract || !stakingPool) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await unpauseContract([]);
      toast.success("StakingPool unpaused successfully!");
      
      // Refetch pause state
      await refetchPauseState();
      
      return tx;
    } catch (error: any) {
      console.error("Unpause error:", error);
      toast.error(error?.message || "Failed to unpause contract");
      throw error;
    }
  }, [contract, unpauseContract, refetchPauseState, stakingPool]);

  return {
    contract,
    poolBalance,
    poolStats,
    isStaking,
    isUnstaking,
    isPausing,
    isUnpausing,
    isPaused,
    contractOwner,
    getStakerInfo,
    stakeTokens,
    unstakeTokens,
    pauseStakingPool,
    unpauseStakingPool,
    refetchPoolBalance,
    refetchPoolStats,
    refetchPauseState,
  };
}

// ============ Quest Manager Hooks ============

/**
 * Hook for interacting with QuestManager contract
 */
export function useQuestManager() {
  const addresses = getContractAddresses();
  const { questManager } = addresses;
  
  console.log('🔧 useQuestManager: Initializing', {
    questManagerAddress: questManager,
    hasAddress: !!questManager
  });
  
  // Contract instance
  const { contract } = useContract(questManager || '', QUEST_MANAGER_ABI);
  
  console.log('🔧 useQuestManager: Contract instance', {
    contract: !!contract,
    contractAddress: contract?.address,
    contractChain: contract?.chain?.id
  });
  
  // Read functions
  const { data: activeQuests, refetch: refetchActiveQuests } = useContractRead(
    contract, "getActiveQuests"
  );
  
  const { data: pendingSubmissions, refetch: refetchPendingSubmissions } = useContractRead(
    contract, "getPendingSubmissions"
  );
  
  const { data: defaultQuestId } = useContractRead(contract, "getDefaultQuestId");

  console.log('🔧 useQuestManager: Contract read results', {
    activeQuests,
    activeQuestsType: typeof activeQuests,
    activeQuestsLength: Array.isArray(activeQuests) ? activeQuests.length : 'not array',
    defaultQuestId: defaultQuestId?.toString(),
    hasContract: !!contract
  });
  
  // Write functions
  const { mutateAsync: submitQuest, isPending: isSubmitting } = useContractWrite(contract, "submitQuest");
  const { mutateAsync: verifyQuest, isPending: isVerifying } = useContractWrite(contract, "verifyQuest");
  const { mutateAsync: toggleStatus, isPending: isToggling } = useContractWrite(contract, "toggleQuestStatus");

  // Helper functions
  const getQuest = useCallback(async (questId: number): Promise<Quest | null> => {
    if (!contract || !questManager) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getQuest",
        params: [questId]
      });
      
      // Handle case where thirdweb wraps result in {result: data}
      const actualResult = result && typeof result === 'object' && 'result' in result ? result.result : result;
      
      if (actualResult && Array.isArray(actualResult) && actualResult.length >= 12) {
        return {
          questId: actualResult[0] as bigint,
          title: actualResult[1] as string,
          description: actualResult[2] as string,
          requirements: actualResult[3] as string,
          rewardAmount: actualResult[4] as bigint,
          isActive: actualResult[5] as boolean,
          startTime: actualResult[6] as bigint,
          endTime: actualResult[7] as bigint,
          maxCompletions: actualResult[8] as bigint,
          currentCompletions: actualResult[9] as bigint,
          creator: actualResult[10] as string,
          createTime: actualResult[11] as bigint,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching quest:", error);
      return null;
    }
  }, [contract, questManager]);

  const getSubmission = useCallback(async (submissionId: number, retries = 3): Promise<QuestSubmission | null> => {
    if (!contract || !questManager) return null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { readContract } = await import('thirdweb');
        const result = await readContract({
          contract,
          method: "getSubmission",
          params: [submissionId]
        });
        
        console.log(`📊 getSubmission(${submissionId}) raw result:`, {
          result,
          isArray: Array.isArray(result),
          length: Array.isArray(result) ? result.length : 'not array',
          type: typeof result,
          hasResultProperty: result && typeof result === 'object' && 'result' in result,
          objectKeys: result && typeof result === 'object' ? Object.keys(result) : 'not object',
          directAccess: result?.result,
          actualData: result && typeof result === 'object' && 'result' in result ? result.result : result
        });
        
        // Handle different thirdweb result structures
        let actualResult = result;
        
        // Check for wrapped result structures
        if (result && typeof result === 'object' && !Array.isArray(result)) {
          // Try direct property access first (more reliable than 'in' operator)
          if (result.result !== undefined) {
            actualResult = result.result;
            console.log(`📊 getSubmission(${submissionId}) using wrapped result:`, typeof actualResult);
          }
          // Check for direct object access to array properties  
          else if (Object.keys(result).length >= 9 && result[0] !== undefined) {
            // Convert object with numeric keys to array
            actualResult = Object.values(result);
            console.log(`📊 getSubmission(${submissionId}) converted object to array:`, actualResult.length);
          }
          // If it's an object that might be the direct tuple
          else if (Object.keys(result).length >= 9) {
            // Try converting the object values directly
            const values = Object.values(result);
            if (values.length >= 9) {
              actualResult = values;
              console.log(`📊 getSubmission(${submissionId}) using object values as array:`, values.length);
            }
          }
        }
        
        console.log(`📊 getSubmission(${submissionId}) processed result:`, {
          originalType: typeof result,
          processedType: typeof actualResult,
          isProcessedArray: Array.isArray(actualResult),
          processedLength: Array.isArray(actualResult) ? actualResult.length : 'not array'
        });
        
        if (actualResult && Array.isArray(actualResult) && actualResult.length >= 9) {
          const parsed = {
            questId: actualResult[0] as bigint,
            player: actualResult[1] as string,
            tweetUrl: actualResult[2] as string,
            submitTime: actualResult[3] as bigint,
            status: actualResult[4] as number,
            verifyTime: actualResult[5] as bigint,
            verifiedBy: actualResult[6] as string,
            nftTokenId: actualResult[7] as bigint,
            rejectionReason: actualResult[8] as string,
          };
          console.log(`📊 getSubmission(${submissionId}) parsed:`, parsed);
          return parsed;
        }
        
        console.warn(`📊 getSubmission(${submissionId}) invalid result structure`);
        return null;
      } catch (error) {
        console.warn(`QuestManager.getSubmission(${submissionId}) attempt ${attempt}/${retries} failed:`, error);
        if (attempt === retries) {
          console.error(`Final attempt failed for getSubmission(${submissionId}):`, error);
          return null;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return null;
  }, [contract, questManager]);

  const getPlayerSubmissions = useCallback(async (playerAddress: string, retries = 3): Promise<bigint[] | null> => {
    if (!contract || !playerAddress || !questManager) return null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { readContract } = await import('thirdweb');
        const result = await readContract({
          contract,
          method: "getPlayerSubmissions",
          params: [playerAddress]
        });
        return result as bigint[];
      } catch (error) {
        console.warn(`QuestManager.getPlayerSubmissions attempt ${attempt}/${retries} failed:`, error);
        if (attempt === retries) {
          console.error("Final attempt failed for getPlayerSubmissions:", error);
          return [];
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return [];
  }, [contract, questManager]);

  const hasPlayerCompleted = useCallback(async (playerAddress: string, questId: number): Promise<boolean> => {
    if (!contract || !playerAddress || !questManager) return false;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "hasPlayerCompletedQuest",
        params: [playerAddress, questId]
      });
      return result as boolean;
    } catch (error) {
      console.error("Error checking quest completion:", error);
      return false;
    }
  }, [contract, questManager]);

  const hasPlayerSubmitted = useCallback(async (playerAddress: string, questId: number): Promise<boolean> => {
    if (!contract || !playerAddress || !questManager) return false;
    
    try {
      // Get all player submissions
      const submissions = await getPlayerSubmissions(playerAddress);
      if (!submissions || submissions.length === 0) return false;
      
      // Check if any submission is for this quest
      for (const submissionId of submissions) {
        const submission = await getSubmission(Number(submissionId));
        if (submission && Number(submission.questId) === questId) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking player submission:", error);
      return false;
    }
  }, [contract, questManager, getPlayerSubmissions, getSubmission]);

  const checkIsAdmin = useCallback(async (address: string): Promise<boolean> => {
    if (!contract || !address || !questManager) return false;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "isAdmin",
        params: [address]
      });
      return result as boolean;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, [contract, questManager]);

  const submitQuestProof = useCallback(async (questId: number, tweetUrl: string) => {
    console.log('🚀 submitQuestProof: Starting submission', {
      questId,
      tweetUrl,
      hasContract: !!contract,
      questManagerAddress: questManager,
      hasSubmitQuest: !!submitQuest
    });

    if (!contract) {
      console.error('❌ submitQuestProof: Contract not available');
      throw new Error("Contract not available or not configured");
    }
    
    if (!questManager) {
      console.error('❌ submitQuestProof: Quest manager address is empty');
      throw new Error("Contract not available or not configured - questManager address is empty");
    }
    
    try {
      console.log('🔄 submitQuestProof: Calling submitQuest with params:', [questId, tweetUrl]);
      const tx = await submitQuest([questId, tweetUrl]);
      
      console.log('✅ submitQuestProof: Transaction successful', {
        transactionHash: tx.transactionHash,
        chain: tx.chain?.id
      });
      
      toast.success("Quest submitted successfully! Waiting for verification...");
      
      // Refetch data
      console.log('🔄 submitQuestProof: Refetching active quests...');
      await refetchActiveQuests();
      
      return tx;
    } catch (error: any) {
      console.error('❌ submitQuestProof: Transaction failed', {
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorData: error?.data
      });
      toast.error(error?.message || "Failed to submit quest");
      throw error;
    }
  }, [contract, submitQuest, refetchActiveQuests, questManager]);

  const verifyQuestSubmission = useCallback(async (
    submissionId: number, 
    approved: boolean, 
    rejectionReason: string = ""
  ) => {
    if (!contract || !questManager) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await verifyQuest([submissionId, approved, rejectionReason]);
      toast.success(`Quest ${approved ? 'approved' : 'rejected'} successfully!`);
      
      // Refetch data
      await refetchPendingSubmissions();
      
      return tx;
    } catch (error: any) {
      console.error("Verify quest error:", error);
      toast.error(error?.message || "Failed to verify quest");
      throw error;
    }
  }, [contract, verifyQuest, refetchPendingSubmissions, questManager]);

  const toggleQuestStatus = useCallback(async (questId: number) => {
    if (!contract || !questManager) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await toggleStatus([questId]);
      toast.success("Quest status updated successfully!");
      
      // Refetch data
      await refetchActiveQuests();
      
      return tx;
    } catch (error: any) {
      console.error("Toggle quest status error:", error);
      toast.error(error?.message || "Failed to toggle quest status");
      throw error;
    }
  }, [contract, toggleStatus, refetchActiveQuests, questManager]);

  return {
    contract,
    activeQuests,
    pendingSubmissions,
    defaultQuestId,
    isSubmitting,
    isVerifying,
    isToggling,
    getQuest,
    getSubmission,
    getPlayerSubmissions,
    hasPlayerCompleted,
    hasPlayerSubmitted,
    checkIsAdmin,
    submitQuestProof,
    verifyQuestSubmission,
    toggleQuestStatus,
    refetchActiveQuests,
    refetchPendingSubmissions,
  };
}

// ============ NFT Minter Hooks ============

/**
 * Hook for interacting with NFTMinter contract
 */
export function useNFTMinter() {
  const { nftMinter } = getContractAddresses();
  
  // Contract instance
  const { contract } = useContract(nftMinter || '', NFT_MINTER_ABI);
  
  // Read functions
  const { data: totalSupply } = useContractRead(contract, "totalSupply");

  // Helper functions
  const getUserBadges = useCallback(async (userAddress: string, retries = 3): Promise<bigint[] | null> => {
    if (!contract || !userAddress || !nftMinter) return null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { readContract } = await import('thirdweb');
        const result = await readContract({
          contract,
          method: "getUserBadges",
          params: [userAddress]
        });
        return result as bigint[];
      } catch (error) {
        console.warn(`NFTMinter.getUserBadges attempt ${attempt}/${retries} failed:`, error);
        if (attempt === retries) {
          console.error("Final attempt failed for getUserBadges:", error);
          return [];
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return [];
  }, [contract, nftMinter]);

  const getBadge = useCallback(async (tokenId: number): Promise<QuestBadge | null> => {
    if (!contract || !nftMinter) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getBadge",
        params: [tokenId]
      });
      
      // Handle case where thirdweb wraps result in {result: data}
      const actualResult = result && typeof result === 'object' && 'result' in result ? result.result : result;
      
      if (actualResult && Array.isArray(actualResult) && actualResult.length >= 7) {
        return {
          questId: actualResult[0] as bigint,
          recipient: actualResult[1] as string,
          tweetUrl: actualResult[2] as string,
          mintTime: actualResult[3] as bigint,
          questReward: actualResult[4] as bigint,
          questTitle: actualResult[5] as string,
          isValid: actualResult[6] as boolean,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching badge:", error);
      return null;
    }
  }, [contract, nftMinter]);

  const getUserBadgeCount = useCallback(async (userAddress: string): Promise<number> => {
    if (!contract || !userAddress || !nftMinter) return 0;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getUserBadgeCount",
        params: [userAddress]
      });
      return Number(result) || 0;
    } catch (error) {
      console.error("Error fetching user badge count:", error);
      return 0;
    }
  }, [contract, nftMinter]);

  const getTokenURI = useCallback(async (tokenId: number): Promise<string | null> => {
    if (!contract || !nftMinter) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "tokenURI",
        params: [tokenId]
      });
      return result as string || "";
    } catch (error) {
      console.error("Error fetching token URI:", error);
      return null;
    }
  }, [contract, nftMinter]);

  return {
    contract,
    totalSupply,
    getUserBadges,
    getBadge,
    getUserBadgeCount,
    getTokenURI,
  };
}

// ============ USDC Token Hooks ============

/**
 * Hook for interacting with USDC token contract
 */
export function useUSDCToken() {
  const { usdcToken } = getContractAddresses();
  
  // Contract instance
  const { contract } = useContract(usdcToken || '', ERC20_ABI);
  
  // Read functions
  const { data: decimals } = useContractRead(contract, "decimals");
  const { data: symbol } = useContractRead(contract, "symbol");
  
  // Write functions
  const { mutateAsync: approve, isPending: isApproving } = useContractWrite(contract, "approve");

  // Helper functions
  const getBalance = useCallback(async (address: string, retries = 3): Promise<bigint | null> => {
    if (!contract || !address || !usdcToken) return null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { readContract } = await import('thirdweb');
        const result = await readContract({
          contract,
          method: "balanceOf",
          params: [address]
        });
        return result as bigint;
      } catch (error) {
        console.warn(`USDC.balanceOf attempt ${attempt}/${retries} failed:`, error);
        if (attempt === retries) {
          console.error("Final attempt failed for USDC balanceOf:", error);
          return BigInt(0);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return BigInt(0);
  }, [contract, usdcToken]);

  const getAllowance = useCallback(async (owner: string, spender: string): Promise<bigint | null> => {
    if (!contract || !owner || !spender || !usdcToken) return null;
    
    // Validate addresses are properly formatted
    if (!owner.startsWith('0x') || owner.length !== 42 || !spender.startsWith('0x') || spender.length !== 42) {
      console.error("Invalid address format:", { owner, spender });
      return BigInt(0);
    }
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "allowance",
        params: [owner, spender]
      });
      return result as bigint;
    } catch (error) {
      console.error("Error fetching allowance:", error);
      return BigInt(0);
    }
  }, [contract, usdcToken]);

  const approveSpender = useCallback(async (spender: string, amount: bigint) => {
    if (!contract || !usdcToken) throw new Error("Contract not available or not configured");
    
    try {
      const tx = await approve([spender, amount]);
      toast.success("Approval successful!");
      return tx;
    } catch (error: any) {
      console.error("Approve error:", error);
      toast.error(error?.message || "Failed to approve spending");
      throw error;
    }
  }, [contract, approve, usdcToken]);

  return {
    contract,
    decimals,
    symbol,
    isApproving,
    getBalance,
    getAllowance,
    approveSpender,
  };
}

// ============ Combined Hooks ============

/**
 * Hook that combines all contract interactions for convenience
 */
export function useContracts() {
  const stakingPool = useStakingPool();
  const questManager = useQuestManager();
  const nftMinter = useNFTMinter();
  const usdcToken = useUSDCToken();

  // Combined loading states
  const isLoading = useMemo(() => ({
    staking: stakingPool.isStaking,
    unstaking: stakingPool.isUnstaking,
    submitting: questManager.isSubmitting,
    verifying: questManager.isVerifying,
    approving: usdcToken.isApproving,
  }), [
    stakingPool.isStaking,
    stakingPool.isUnstaking,
    questManager.isSubmitting,
    questManager.isVerifying,
    usdcToken.isApproving,
  ]);

  // Check if any operation is loading
  const isAnyLoading = useMemo(() => 
    Object.values(isLoading).some(loading => loading),
    [isLoading]
  );

  return {
    stakingPool,
    questManager,
    nftMinter,
    usdcToken,
    isLoading,
    isAnyLoading,
  };
}

// ============ Utility Functions ============

/**
 * Format bigint to human readable string
 */
export function formatTokenAmount(
  amount: bigint | undefined, 
  decimals: number = 6, 
  displayDecimals: number = 2
): string {
  if (!amount) return "0";
  
  try {
    const divisor = BigInt(10 ** decimals);
    const quotient = amount / divisor;
    const remainder = amount % divisor;
    
    if (remainder === BigInt(0)) {
      return quotient.toString();
    }
    
    const decimal = remainder.toString().padStart(decimals, "0");
    const trimmed = decimal.slice(0, displayDecimals).replace(/0+$/, "");
    
    return trimmed ? `${quotient}.${trimmed}` : quotient.toString();
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
}

/**
 * Parse human readable string to bigint
 */
export function parseTokenAmount(amount: string, decimals: number = 6): bigint {
  try {
    const [whole, decimal = ""] = amount.split(".");
    const paddedDecimal = decimal.padEnd(decimals, "0").slice(0, decimals);
    const combined = whole + paddedDecimal;
    return BigInt(combined);
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return BigInt(0);
  }
}

/**
 * Check if contracts are properly configured
 */
export function useContractValidation() {
  const addresses = getContractAddresses();
  
  const isValid = useMemo(() => {
    return Object.values(addresses).every(addr => addr && addr.trim() !== "" && addr !== "undefined");
  }, [addresses]);

  const missingAddresses = useMemo(() => {
    return Object.entries(addresses)
      .filter(([, addr]) => !addr || addr.trim() === "" || addr === "undefined")
      .map(([key]) => key);
  }, [addresses]);

  return {
    isValid,
    missingAddresses,
    addresses,
  };
}