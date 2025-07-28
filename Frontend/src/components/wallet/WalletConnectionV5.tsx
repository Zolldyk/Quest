'use client';

// ============ Imports ============
import { ConnectButton } from 'thirdweb/react';
import { createWallet } from 'thirdweb/wallets';
import { client, ETHERLINK_TESTNET, ETHERLINK_MAINNET } from '../../hooks/useThirdwebV5';
import { useState } from 'react';
import { 
  WalletIcon, 
  ChevronDownIcon, 
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

// ============ Types ============
interface WalletConnectionV5Props {
  className?: string;
  variant?: 'default' | 'compact' | 'icon-only';
  theme?: 'light' | 'dark';
}

// ============ Wallet Configuration ============
const wallets = [
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('me.rainbow'),
  createWallet('io.rabby'),
];

// Get active chain
const getActiveChain = () => {
  const forceMainnet = process.env.NEXT_PUBLIC_USE_MAINNET === 'true';
  return forceMainnet ? ETHERLINK_MAINNET : ETHERLINK_TESTNET;
};

/**
 * @title WalletConnectionV5
 * @notice Thirdweb v5 wallet connection component
 * @dev Uses Thirdweb v5 ConnectButton with Etherlink configuration
 */
export default function WalletConnectionV5({ 
  className = "",
  variant = "default",
  theme = "light"
}: WalletConnectionV5Props) {

  const activeChain = getActiveChain();

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={className}>
        <ConnectButton
          client={client}
          wallets={wallets}
          chain={activeChain}
          connectButton={{
            label: "Connect",
            style: {
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '8px',
            }
          }}
          connectModal={{
            title: "Connect to Quest DApp",
            titleIcon: "/images/logo.png",
            showThirdwebBranding: false,
          }}
        />
      </div>
    );
  }

  // Icon only variant
  if (variant === 'icon-only') {
    return (
      <div className={className}>
        <ConnectButton
          client={client}
          wallets={wallets}
          chain={activeChain}
          connectButton={{
            label: "",
            style: {
              padding: '8px',
              borderRadius: '8px',
              minWidth: 'auto',
              width: '40px',
              height: '40px',
            }
          }}
          connectModal={{
            title: "Connect Wallet",
            showThirdwebBranding: false,
          }}
        />
      </div>
    );
  }

  // Default variant
  return (
    <div className={className}>
      <ConnectButton
        client={client}
        wallets={wallets}
        chain={activeChain}
        connectButton={{
          label: "Connect Wallet",
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }
        }}
        connectModal={{
          title: "Welcome to Quest DApp",
          titleIcon: "/images/quest-logo.png",
          showThirdwebBranding: false,
          welcomeScreen: {
            title: "Quest DApp",
            subtitle: "Connect your wallet to start earning rewards and completing quests on Etherlink",
            img: {
              src: "/images/wallet-connect.png",
              width: 300,
              height: 200,
            },
          },
          termsOfServiceUrl: "/terms",
          privacyPolicyUrl: "/privacy",
        }}
        detailsButton={{
          style: {
            backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
            color: theme === 'dark' ? 'white' : '#1f2937',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '8px 16px',
          }
        }}
        switchButton={{
          style: {
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '14px',
          }
        }}
      />
    </div>
  );
}

// ============ Custom Hook for V5 Compatibility ============

/**
 * Hook that provides v4-like interface for v5 wallet connection
 */
export function useWalletConnectionV5() {
  // Note: In v5, wallet state is managed differently
  // This hook provides compatibility layer for existing components
  
  return {
    // These would need to be implemented using v5 hooks
    address: null, // useActiveAccount()?.address
    isConnected: false, // !!useActiveAccount()
    wallet: null, // useActiveWallet()
    balance: "0",
    isConnecting: false,
    
    // Methods
    connectWallet: async () => {
      // Connection is handled by ConnectButton
      return true;
    },
    
    disconnectWallet: async () => {
      // Disconnection is handled by ConnectButton
      return true;
    },
  };
}

// ============ Connection Status Component V5 ============

interface ConnectionStatusV5Props {
  className?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export function ConnectionStatusV5({ 
  className = "", 
  showText = true,
  theme = 'light'
}: ConnectionStatusV5Props) {
  // In v5, you'd use actual hooks here
  const isConnected = false; // useActiveAccount() !== null
  const isConnecting = false; // Would need to track this state

  const statusColor = isConnected ? 'green' : isConnecting ? 'yellow' : 'gray';
  const statusText = isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Not Connected';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 bg-${statusColor}-400 rounded-full ${isConnecting ? 'animate-pulse' : ''}`}></div>
      {showText && (
        <span className={`text-sm text-${statusColor}-600 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
          {statusText}
        </span>
      )}
    </div>
  );
}

// ============ Wallet Protected Component V5 ============

interface WalletProtectedV5Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark';
}

export function WalletProtectedV5({ 
  children, 
  fallback,
  className = "",
  theme = 'light'
}: WalletProtectedV5Props) {
  const isConnected = false; // useActiveAccount() !== null

  if (!isConnected) {
    return (
      <div className={`text-center py-12 ${className}`}>
        {fallback || (
          <div className="max-w-md mx-auto">
            <WalletIcon className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Wallet Required
            </h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Please connect your wallet to access this feature.
            </p>
            <WalletConnectionV5 variant="default" theme={theme} />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}