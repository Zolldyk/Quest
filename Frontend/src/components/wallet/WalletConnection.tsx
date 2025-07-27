'use client';

// ============ Imports ============
import { useAddress, useDisconnect, useWallet } from "../../hooks/useThirdwebV5";
import WalletConnectionV5 from "./WalletConnectionV5";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  WalletIcon, 
  ChevronDownIcon, 
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

// ============ Types ============
interface WalletConnectionProps {
  className?: string;
  showBalance?: boolean;
  showDisconnect?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
}

interface WalletDropdownProps {
  address: string;
  balance?: string;
  onDisconnect: () => void;
}

/**
 * @title WalletConnection
 * @notice Main wallet connection component with multiple display variants
 * @dev Uses Thirdweb v5 hooks for wallet management with enhanced UX
 */
export default function WalletConnection({ 
  className = "",
  showBalance = true,
  showDisconnect = true,
  variant = "default"
}: WalletConnectionProps) {

  // ============ Hooks ============
  const address = useAddress();
  const wallet = useWallet();
  const { disconnect } = useDisconnect();
  
  // Local state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ============ Effects ============
  
  // Fetch user balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (address && wallet) {
        try {
          // In v5, balance fetching might be different
          // This is a placeholder for now
          setBalance("0");
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance("0");
        }
      }
    };

    fetchBalance();
    
    // Set up interval to refresh balance
    const interval = setInterval(fetchBalance, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [address, wallet]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-wallet-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // ============ Handlers ============
  
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Let WalletConnectionV5's ConnectButton handle the connection
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success("Address copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Copy error:", error);
        toast.error("Failed to copy address");
      }
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.001) return "< 0.001";
    if (num < 1) return num.toFixed(3);
    return num.toFixed(2);
  };

  // ============ Render Methods ============

  // Not connected state - use WalletConnectionV5
  if (!address) {
    return (
      <div className={className}>
        <WalletConnectionV5 
          variant={variant}
          className={variant === 'icon-only' ? 
            "p-2 rounded-lg border border-gray-300 hover:border-primary-500 bg-white hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" :
            "!bg-primary-600 hover:!bg-primary-700 !text-white !font-medium !rounded-lg !px-6 !py-3 !transition-all !duration-200"
          }
        />
      </div>
    );
  }

  // Connected state - different variants
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-900">
            {formatAddress(address)}
          </span>
        </div>
        {showDisconnect && (
          <button
            onClick={handleDisconnect}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Disconnect"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div className="relative" data-wallet-dropdown>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            flex items-center p-2 rounded-lg border border-green-300 bg-green-50 
            hover:bg-green-100 transition-all duration-200 ${className}
          `}
          title={`Connected: ${formatAddress(address)}`}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <WalletIcon className="h-5 w-5 text-green-600" />
        </button>
        
        {isDropdownOpen && (
          <WalletDropdown 
            address={address}
            balance={showBalance ? balance : undefined}
            onDisconnect={handleDisconnect}
          />
        )}
      </div>
    );
  }

  // Default variant - full display
  return (
    <div className={`relative ${className}`} data-wallet-dropdown>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="
          flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-2
          hover:border-primary-500 hover:shadow-md transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        "
      >
        {/* Connection indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <WalletIcon className="h-5 w-5 text-gray-600" />
        </div>

        {/* Address and balance */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {formatAddress(address)}
          </span>
          {showBalance && (
            <span className="text-xs text-gray-500">
              {formatBalance(balance)} XTZ
            </span>
          )}
        </div>

        {/* Dropdown arrow */}
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <WalletDropdown 
          address={address}
          balance={showBalance ? balance : undefined}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
}

// ============ Wallet Dropdown Component ============
function WalletDropdown({ address, balance, onDisconnect }: WalletDropdownProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.001) return "< 0.001";
    if (num < 1) return num.toFixed(3);
    return num.toFixed(2);
  };

  return (
    <div className="
      absolute top-full mt-2 right-0 w-72 bg-white rounded-lg shadow-lg border border-gray-200
      z-50 overflow-hidden animate-slide-down
    ">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">Connected</span>
        </div>
      </div>

      {/* Address section */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
            <p className="text-sm font-mono text-gray-900 mt-1">
              {formatAddress(address)}
            </p>
          </div>
          <button
            onClick={copyAddress}
            className="
              p-2 text-gray-400 hover:text-gray-600 rounded-md 
              hover:bg-gray-100 transition-colors duration-200
            "
            title="Copy address"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <DocumentDuplicateIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Balance section */}
      {balance && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formatBalance(balance)} XTZ
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3">
        <button
          onClick={onDisconnect}
          className="
            flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600
            hover:bg-red-50 rounded-md transition-colors duration-200
          "
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span>Disconnect Wallet</span>
        </button>
      </div>
    </div>
  );
}

// ============ Utility Hook ============

/**
 * Custom hook for wallet connection state (v5 compatible)
 */
export function useWalletConnection() {
  const address = useAddress();
  const wallet = useWallet();
  const { disconnect } = useDisconnect();
  
  const [isConnecting] = useState(false);
  const [balance, setBalance] = useState<string>("0");

  const connectWallet = async () => {
    // Thirdweb v5's ConnectButton component handles connection
    return true;
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      return true;
    } catch (error) {
      console.error("Disconnect failed:", error);
      return false;
    }
  };

  // Fetch balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (address && wallet) {
        try {
          // In v5, balance fetching would be different
          // This is a placeholder
          setBalance("0");
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance("0");
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [address, wallet]);

  return {
    address,
    wallet,
    balance,
    isConnected: !!address,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };
}

// ============ Connection Status Component ============

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export function ConnectionStatus({ className = "", showText = true }: ConnectionStatusProps) {
  const { isConnected, isConnecting } = useWalletConnection();

  if (isConnecting) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        {showText && <span className="text-sm text-yellow-600">Connecting...</span>}
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        {showText && <span className="text-sm text-green-600">Connected</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      {showText && <span className="text-sm text-gray-500">Not Connected</span>}
    </div>
  );
}

// ============ Protected Route Component ============

interface WalletProtectedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function WalletProtected({ 
  children, 
  fallback,
  className = ""
}: WalletProtectedProps) {
  const { isConnected } = useWalletConnection();

  if (!isConnected) {
    return (
      <div className={`text-center py-12 ${className}`}>
        {fallback || (
          <div className="max-w-md mx-auto">
            <WalletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallet Required
            </h3>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access this feature.
            </p>
            <WalletConnection variant="default" />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}