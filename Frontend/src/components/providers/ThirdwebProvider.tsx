'use client';

// ============ Imports ============
import { ThirdwebProvider } from 'thirdweb/react';
import { defineChain } from 'thirdweb/chains';
import { ReactNode } from 'react';

// ============ Types ============
interface CustomThirdwebProviderProps {
  children: ReactNode;
}

// ============ Configuration ============

// Etherlink Mainnet configuration
const ETHERLINK_MAINNET = defineChain({
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

// Etherlink Testnet configuration  
const ETHERLINK_TESTNET = defineChain({
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

// Determine which network to use based on environment
const getActiveChain = () => {
  if (typeof window === 'undefined') {
    return ETHERLINK_TESTNET; // Default for SSR
  }
  
  // For development, always use testnet unless explicitly set to mainnet
  const forceMainnet = process.env.NEXT_PUBLIC_USE_MAINNET === 'true';
  
  return forceMainnet ? ETHERLINK_MAINNET : ETHERLINK_TESTNET;
};



// Import required Thirdweb client
import { createThirdwebClient } from 'thirdweb';

// Create client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'your-client-id-here'
});

/**
 * @title CustomThirdwebProvider  
 * @notice Wrapper around ThirdwebProvider with Etherlink configuration
 * @dev Provides blockchain connection and wallet management for the Quest DApp
 */
export default function CustomThirdwebProvider({ children }: CustomThirdwebProviderProps) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}

// ============ Helper Functions ============

/**
 * Get the current active chain configuration
 */
export function getChainConfig() {
  return getActiveChain();
}

/**
 * Get block explorer URL for the active chain
 */
export function getExplorerUrl(address?: string, type: 'address' | 'tx' = 'address') {
  const chain = getActiveChain();
  const baseUrl = chain.blockExplorers?.[0]?.url || 'https://explorer.etherlink.com';
  
  if (!address) return baseUrl;
  
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${address}`;
    case 'address':
    default:
      return `${baseUrl}/address/${address}`;
  }
}

/**
 * Check if we are on mainnet
 */
export function isMainnet() {
  return getActiveChain().id === ETHERLINK_MAINNET.id;
}

/**
 * Get the native currency symbol for the active chain
 */
export function getNativeCurrency() {
  return getActiveChain().nativeCurrency;
}

/**
 * Get RPC URL for the active chain
 */
export function getRpcUrl() {
  return getActiveChain().rpc;
}