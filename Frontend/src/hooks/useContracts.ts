// ============ Imports ============
import { useContract, useContractRead, useContractWrite } from "../hooks/useThirdwebV5";
import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

// ============ Contract ABIs ============
// Import your contract ABIs here or define them inline
// For now, we'll define the essential function signatures

const STAKING_POOL_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external", 
  "function getPoolBalance() external view returns (uint256)",
  "function getStakerInfo(address staker) external view returns (uint256, uint256, uint256, bool)",
  "function getPoolStats() external view returns (uint256, uint256, uint256, uint256)",
  "function getStakingToken() external view returns (address)",
] as const;

const QUEST_MANAGER_ABI = [
  "function submitQuest(uint256 questId, string tweetUrl) external",
  "function verifyQuest(uint256 submissionId, bool approved, string rejectionReason) external",
  "function getQuest(uint256 questId) external view returns (tuple(uint256,string,string,string,uint256,bool,uint256,uint256,uint256,uint256,address,uint256))",
  "function getSubmission(uint256 submissionId) external view returns (tuple(uint256,address,string,uint256,uint8,uint256,address,uint256,string))",
  "function getActiveQuests() external view returns (uint256[])",
  "function getPendingSubmissions() external view returns (uint256[])",
  "function getPlayerSubmissions(address player) external view returns (uint256[])",
  "function hasPlayerCompletedQuest(address player, uint256 questId) external view returns (bool)",
  "function isAdmin(address account) external view returns (bool)",
  "function getDefaultQuestId() external pure returns (uint256)",
] as const;

const NFT_MINTER_ABI = [
  "function getBadge(uint256 tokenId) external view returns (tuple(uint256,address,string,uint256,uint256,string,bool))",
  "function getUserBadges(address user) external view returns (uint256[])",
  "function getUserBadgeCount(address user) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
] as const;

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
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

  console.log('Contract addresses loaded:', addresses);
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

  // Validate addresses
  const missingAddresses = Object.entries(addresses)
    .filter(([, value]) => !value || value.trim() === '' || value === 'undefined')
    .map(([key]) => key);

  if (missingAddresses.length > 0) {
    console.error(`Missing contract addresses: ${missingAddresses.join(', ')}`);
    console.error('Please check your environment variables.');
    console.error('Current env vars:', {
      STAKING_POOL: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS,
      QUEST_MANAGER: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS,
      NFT_MINTER: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS,
      USDC_TOKEN: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS,
    });
    console.error('All process.env keys with NEXT_PUBLIC:', 
      Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC'))
    );
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
  
  // Helper functions
  const getStakerInfo = useCallback(async (address: string): Promise<StakerInfo | null> => {
    if (!contract || !address || !stakingPool) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getStakerInfo",
        params: [address]
      });
      
      if (result && Array.isArray(result) && result.length >= 4) {
        return {
          stakedAmount: result[0] as bigint,
          stakeTimestamp: result[1] as bigint,
          lastUpdateTime: result[2] as bigint,
          isActive: result[3] as boolean,
        };
      }
      
      return {
        stakedAmount: BigInt(0),
        stakeTimestamp: BigInt(0),
        lastUpdateTime: BigInt(0),
        isActive: false,
      };
    } catch (error) {
      console.error("Error fetching staker info:", error);
      return {
        stakedAmount: BigInt(0),
        stakeTimestamp: BigInt(0),
        lastUpdateTime: BigInt(0),
        isActive: false,
      };
    }
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

  return {
    contract,
    poolBalance,
    poolStats,
    isStaking,
    isUnstaking,
    getStakerInfo,
    stakeTokens,
    unstakeTokens,
    refetchPoolBalance,
    refetchPoolStats,
  };
}

// ============ Quest Manager Hooks ============

/**
 * Hook for interacting with QuestManager contract
 */
export function useQuestManager() {
  const addresses = getContractAddresses();
  const { questManager } = addresses;
  
  console.log('useQuestManager hook initializing:', {
    questManager,
    questManagerAddress: questManager || 'EMPTY',
    allAddresses: addresses,
    envVarsDirectly: {
      QUEST_MANAGER: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS,
      STAKING_POOL: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS,
      NFT_MINTER: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS,
      USDC_TOKEN: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS,
      THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID
    }
  });
  
  // Contract instance
  const { contract } = useContract(questManager || '', QUEST_MANAGER_ABI);
  
  console.log('useQuestManager contract result:', {
    contract: !!contract,
    contractAddress: contract?.address,
    questManagerParam: questManager,
    contractObject: contract
  });
  
  // Read functions
  const { data: activeQuests, refetch: refetchActiveQuests } = useContractRead(
    contract, "getActiveQuests"
  );
  
  const { data: pendingSubmissions, refetch: refetchPendingSubmissions } = useContractRead(
    contract, "getPendingSubmissions"
  );
  
  const { data: defaultQuestId } = useContractRead(contract, "getDefaultQuestId");
  
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
      
      if (result && Array.isArray(result) && result.length >= 12) {
        return {
          questId: result[0] as bigint,
          title: result[1] as string,
          description: result[2] as string,
          requirements: result[3] as string,
          rewardAmount: result[4] as bigint,
          isActive: result[5] as boolean,
          startTime: result[6] as bigint,
          endTime: result[7] as bigint,
          maxCompletions: result[8] as bigint,
          currentCompletions: result[9] as bigint,
          creator: result[10] as string,
          createTime: result[11] as bigint,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching quest:", error);
      return null;
    }
  }, [contract, questManager]);

  const getSubmission = useCallback(async (submissionId: number): Promise<QuestSubmission | null> => {
    if (!contract || !questManager) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getSubmission",
        params: [submissionId]
      });
      
      if (result && Array.isArray(result) && result.length >= 9) {
        return {
          questId: result[0] as bigint,
          player: result[1] as string,
          tweetUrl: result[2] as string,
          submitTime: result[3] as bigint,
          status: result[4] as number,
          verifyTime: result[5] as bigint,
          verifiedBy: result[6] as string,
          nftTokenId: result[7] as bigint,
          rejectionReason: result[8] as string,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching submission:", error);
      return null;
    }
  }, [contract, questManager]);

  const getPlayerSubmissions = useCallback(async (playerAddress: string): Promise<bigint[] | null> => {
    if (!contract || !playerAddress || !questManager) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getPlayerSubmissions",
        params: [playerAddress]
      });
      return result as bigint[];
    } catch (error) {
      console.error("Error fetching player submissions:", error);
      return [];
    }
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
    console.log('submitQuestProof called with:', {
      questId,
      tweetUrl,
      contract: !!contract,
      contractDetails: {
        exists: !!contract,
        address: contract?.address,
        type: typeof contract,
        keys: contract ? Object.keys(contract) : 'NO_CONTRACT'
      },
      questManager,
      questManagerType: typeof questManager,
      questManagerValue: questManager,
      submitQuest: typeof submitQuest,
      submitQuestExists: !!submitQuest
    });
    
    if (!contract) {
      console.error('CONTRACT IS NULL/UNDEFINED:', {
        contract,
        contractType: typeof contract,
        questManager,
        questManagerType: typeof questManager,
        allEnvVars: {
          QUEST_MANAGER: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS,
          STAKING_POOL: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS,
          NFT_MINTER: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS,
          USDC_TOKEN: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS,
          THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID
        }
      });
      throw new Error("Contract not available or not configured - contract is null");
    }
    
    if (!questManager) {
      console.error('QUEST_MANAGER ADDRESS IS EMPTY:', {
        questManager,
        questManagerType: typeof questManager,
        contractExists: !!contract,
        contractAddress: contract?.address,
        envVar: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS
      });
      throw new Error("Contract not available or not configured - questManager address is empty");
    }
    
    // Success: Both contract and questManager are available
    console.log('SUCCESS: Contract and questManager are both available!', {
      contractAddress: contract.address,
      questManagerAddress: questManager,
      submitQuestFunction: typeof submitQuest
    });
    alert('SUCCESS: Contract connection established! Proceeding with quest submission...');
    
    try {
      console.log('About to call submitQuest with params:', [questId, tweetUrl]);
      const tx = await submitQuest([questId, tweetUrl]);
      console.log('submitQuest transaction result:', tx);
      toast.success("Quest submitted successfully! Waiting for verification...");
      
      // Refetch data
      await refetchActiveQuests();
      
      return tx;
    } catch (error: any) {
      console.error("Submit quest error:", error);
      console.error("Submit quest error details:", {
        message: error?.message,
        cause: error?.cause,
        stack: error?.stack,
        reason: error?.reason,
        code: error?.code
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
  const getUserBadges = useCallback(async (userAddress: string): Promise<bigint[] | null> => {
    if (!contract || !userAddress || !nftMinter) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "getUserBadges",
        params: [userAddress]
      });
      return result as bigint[];
    } catch (error) {
      console.error("Error fetching user badges:", error);
      return [];
    }
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
      
      if (result && Array.isArray(result) && result.length >= 7) {
        return {
          questId: result[0] as bigint,
          recipient: result[1] as string,
          tweetUrl: result[2] as string,
          mintTime: result[3] as bigint,
          questReward: result[4] as bigint,
          questTitle: result[5] as string,
          isValid: result[6] as boolean,
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
  const getBalance = useCallback(async (address: string): Promise<bigint | null> => {
    if (!contract || !address || !usdcToken) return null;
    
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract,
        method: "balanceOf",
        params: [address]
      });
      return result as bigint;
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      return BigInt(0);
    }
  }, [contract, usdcToken]);

  const getAllowance = useCallback(async (owner: string, spender: string): Promise<bigint | null> => {
    if (!contract || !owner || !spender || !usdcToken) return null;
    
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