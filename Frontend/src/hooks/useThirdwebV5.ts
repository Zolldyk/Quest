/**
 * Thirdweb v5 Hooks and Utilities
 * Centralized hooks for migrating from v4 to v5
 */

import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { useActiveAccount, useActiveWallet, useConnect } from 'thirdweb/react';
import { readContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { useMemo, useState, useEffect, useCallback } from 'react';

// ============ Client Configuration ============
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'your-client-id-here'
});

// ============ Chain Configuration ============
export const ETHERLINK_MAINNET = defineChain({
  id: 42793,
  name: 'Etherlink Mainnet',
  nativeCurrency: {
    name: 'XTZ',
    symbol: 'XTZ',
    decimals: 18,
  },
  rpc: 'https://node.mainnet.etherlink.com',
  blockExplorers: [
    {
      name: 'Etherlink Explorer',
      url: 'https://explorer.etherlink.com',
    },
  ],
});

export const ETHERLINK_TESTNET = defineChain({
  id: 128123,
  name: 'Etherlink Testnet',
  nativeCurrency: {
    name: 'XTZ',
    symbol: 'XTZ',
    decimals: 18,
  },
  rpc: 'https://node.ghostnet.etherlink.com',
  blockExplorers: [
    {
      name: 'Etherlink Testnet Explorer',
      url: 'https://testnet.explorer.etherlink.com',
    },
  ],
});

// ============ Active Chain ============
export const getActiveChain = () => {
  const forceMainnet = process.env.NEXT_PUBLIC_USE_MAINNET === 'true';
  return forceMainnet ? ETHERLINK_MAINNET : ETHERLINK_TESTNET;
};

// ============ Contract Addresses ============
export const CONTRACT_ADDRESSES = {
  stakingPool: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS || '',
  questManager: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS || '',
  nftMinter: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS || '',
  usdcToken: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || '',
};

// ============ V5 Compatibility Hooks ============

/**
 * Hook to get the current connected address (v4 compatibility)
 */
export function useAddress() {
  const account = useActiveAccount();
  return account?.address;
}

/**
 * Hook to get the active wallet (v4 compatibility)
 */
export function useWallet() {
  return useActiveWallet();
}

/**
 * Hook to get connection status (v4 compatibility)
 */
export function useConnectionStatus() {
  const account = useActiveAccount();
  return account ? 'connected' : 'disconnected';
}

/**
 * Hook to disconnect wallet (v4 compatibility)
 */
export function useDisconnect() {
  const wallet = useActiveWallet();
  
  return {
    disconnect: async () => {
      if (wallet) {
        await wallet.disconnect();
      }
    }
  };
}

/**
 * Hook to get a contract instance (v4 compatibility)
 */
export function useContract(address: string, abi?: any) {
  const contract = useMemo(() => {
    if (!address) {
      console.warn('Contract creation attempted with empty address');
      return null;
    }
    
    console.log('Creating contract instance:', {
      address,
      chain: getActiveChain(),
      chainId: getActiveChain().id,
      hasABI: !!abi
    });
    
    try {
      const contractInstance = getContract({
        client,
        chain: getActiveChain(),
        address,
        abi
      });
      
      console.log('Contract instance created successfully:', {
        address: contractInstance.address,
        chainId: contractInstance.chain?.id
      });
      
      return contractInstance;
    } catch (error) {
      console.error('Failed to create contract instance:', {
        address,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }, [address, abi]);

  return { contract };
}

/**
 * Hook for reading contract data (v4 compatibility)
 */
export function useContractRead(contract: any, functionName: string, args?: any[]) {
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    if (!contract) {
      console.warn('Contract read attempted but contract is null/undefined for method:', functionName);
      return;
    }
    
    console.log('Contract read starting:', {
      contractAddress: contract.address,
      method: functionName,
      params: args,
      chain: contract.chain?.id
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await readContract({
        contract,
        method: functionName,
        params: args || []
      });
      console.log('Contract read success:', {
        method: functionName,
        result: result
      });
      setData(result);
      return result;
    } catch (error) {
      console.error('Contract read error:', {
        method: functionName,
        contractAddress: contract.address,
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      setError(error);
      // Don't throw the error - let components handle undefined data gracefully
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [contract, functionName, args]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (contract) {
      refetch().catch((error) => {
        // Silently handle errors - they're already logged in refetch
        console.warn('Auto-fetch failed, component will handle undefined data:', error.message);
      });
    }
  }, [refetch, contract]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for writing to contracts (v4 compatibility)
 */
export function useContractWrite(contract: any, functionName: string) {
  const account = useActiveAccount();
  const [isPending, setIsPending] = useState(false);
  
  return {
    mutateAsync: async (args: any) => {
      if (!contract) {
        console.error('Contract write failed: Contract not available', { functionName });
        throw new Error('Contract not available or not configured');
      }
      if (!account) {
        console.error('Contract write failed: No account connected', { functionName });
        throw new Error('No account connected');
      }
      
      console.log('Contract write starting:', {
        contractAddress: contract.address,
        method: functionName,
        params: args,
        account: account.address,
        chain: contract.chain?.id
      });
      
      setIsPending(true);
      
      try {
        const transaction = prepareContractCall({
          contract,
          method: functionName,
          params: Array.isArray(args) ? args : [args]
        });
        
        console.log('Prepared contract call:', {
          to: transaction.to,
          data: transaction.data
        });
        
        const result = await sendTransaction({
          transaction,
          account
        });
        
        console.log('Contract write success:', {
          method: functionName,
          transactionHash: result.transactionHash,
          contractAddress: contract.address
        });
        
        return result;
      } catch (error) {
        console.error('Contract write error:', {
          method: functionName,
          contractAddress: contract.address,
          error: error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          account: account.address
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    isPending,
    isLoading: isPending
  };
}

// ============ Helper Functions ============

/**
 * Get contract instances for all main contracts
 */
export function getContracts() {
  const chain = getActiveChain();
  
  return {
    stakingPool: CONTRACT_ADDRESSES.stakingPool ? getContract({
      client,
      chain,
      address: CONTRACT_ADDRESSES.stakingPool
    }) : null,
    
    questManager: CONTRACT_ADDRESSES.questManager ? getContract({
      client,
      chain,
      address: CONTRACT_ADDRESSES.questManager
    }) : null,
    
    nftMinter: CONTRACT_ADDRESSES.nftMinter ? getContract({
      client,
      chain,
      address: CONTRACT_ADDRESSES.nftMinter
    }) : null,
    
    usdcToken: CONTRACT_ADDRESSES.usdcToken ? getContract({
      client,
      chain,
      address: CONTRACT_ADDRESSES.usdcToken
    }) : null,
  };
}

/**
 * Format token amounts (utility function)
 */
export function formatTokenAmount(amount: bigint | string | number, decimals: number = 18): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === BigInt(0)) {
    return quotient.toString();
  }
  
  const fractional = remainder.toString().padStart(decimals, '0');
  const trimmed = fractional.replace(/0+$/, '');
  
  return trimmed ? `${quotient}.${trimmed}` : quotient.toString();
}

/**
 * Parse token amounts (utility function)
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [whole, fractional = ''] = amount.split('.');
  const wholeBigInt = BigInt(whole || '0') * BigInt(10 ** decimals);
  const fractionalBigInt = BigInt(fractional.padEnd(decimals, '0').slice(0, decimals));
  
  return wholeBigInt + fractionalBigInt;
}