// ============ Imports ============
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAddress, useConnectionStatus, useWallet, useDisconnect } from './useThirdwebV5';
import { toast } from 'react-hot-toast';
import { useLocalStorage } from './useLocalStorage';

// ============ Types ============
interface AuthState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  isAuthenticated: boolean;
  lastConnectedWallet: string | null;
}

interface WalletPreferences {
  autoConnect: boolean;
  preferredWallet: string | null;
  lastConnectedTimestamp: number;
}

// ============ Constants ============
const AUTH_STORAGE_KEY = 'quest_auth_prefs';
const CONNECTION_TIMEOUT = 30000; // 30 seconds

/**
 * @title useAuth
 * @notice Custom hook for managing wallet authentication and connection state
 * @dev Integrates with Thirdweb v5 wallet connection and provides additional auth state management
 */
export function useAuth() {
  // ============ Thirdweb v5 Hooks ============
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const wallet = useWallet();
  const { disconnect } = useDisconnect();

  // ============ State Management ============
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Toast functions using react-hot-toast
  const showSuccess = useCallback((message: string) => toast.success(message), []);
  const showError = useCallback((message: string) => toast.error(message), []);

  // ============ Local Storage ============
  const [walletPreferences, setWalletPreferences] = useLocalStorage<WalletPreferences>(
    AUTH_STORAGE_KEY,
    {
      autoConnect: false,
      preferredWallet: null,
      lastConnectedTimestamp: 0
    }
  );

  // ============ Computed State ============
  const authState: AuthState = useMemo(() => ({
    isConnected: connectionStatus === 'connected' && !!address,
    isConnecting: isConnecting,
    address: address || null,
    isAuthenticated: connectionStatus === 'connected' && !!address,
    lastConnectedWallet: walletPreferences.preferredWallet
  }), [connectionStatus, address, isConnecting, walletPreferences.preferredWallet]);

  // ============ Connection Management ============
  /**
   * Connect to wallet with error handling and persistence
   * @param walletId Optional wallet ID to connect to specific wallet
   */
  const connectWallet = useCallback(async (walletId?: string) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      // Set connection timeout
      const timeoutId = setTimeout(() => {
        setConnectionError('Connection timeout. Please try again.');
        setIsConnecting(false);
      }, CONNECTION_TIMEOUT);

      // Wait for connection
      // Note: In Thirdweb v5, connection is handled by ConnectButton component
      // This function mainly manages state and preferences
      
      // Clear timeout on success
      clearTimeout(timeoutId);

      // Update preferences if connection is successful
      if (walletId) {
        setWalletPreferences((prev: WalletPreferences) => ({
          ...prev,
          preferredWallet: walletId,
          lastConnectedTimestamp: Date.now(),
          autoConnect: true
        }));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setConnectionError(errorMessage);
      showError(`Connection failed: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  }, [setWalletPreferences, showError]);

  /**
   * Disconnect wallet and clear preferences
   */
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      
      // Clear preferences
      setWalletPreferences((prev: WalletPreferences) => ({
        ...prev,
        autoConnect: false,
        lastConnectedTimestamp: 0
      }));

      showSuccess('Wallet disconnected successfully');
      setConnectionError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      showError(`Disconnect failed: ${errorMessage}`);
    }
  }, [disconnect, setWalletPreferences, showSuccess, showError]);

  /**
   * Toggle auto-connect preference
   */
  const toggleAutoConnect = useCallback(() => {
    setWalletPreferences((prev: WalletPreferences) => ({
      ...prev,
      autoConnect: !prev.autoConnect
    }));
  }, [setWalletPreferences]);

  /**
   * Clear all auth data and preferences
   */
  const clearAuthData = useCallback(() => {
    setWalletPreferences({
      autoConnect: false,
      preferredWallet: null,
      lastConnectedTimestamp: 0
    });
    setConnectionError(null);
  }, [setWalletPreferences]);

  // ============ Effects ============
  /**
   * Handle connection status changes
   */
  useEffect(() => {
    if (connectionStatus === 'connected' && address) {
      setIsConnecting(false);
      setConnectionError(null);
      
      // Update last connected timestamp
      setWalletPreferences((prev: WalletPreferences) => ({
        ...prev,
        lastConnectedTimestamp: Date.now()
      }));

      showSuccess('Wallet connected successfully');
    }

    if (connectionStatus === 'disconnected') {
      setIsConnecting(false);
    }
  }, [connectionStatus, address, setWalletPreferences, showSuccess]);

  /**
   * Handle wallet changes
   */
  useEffect(() => {
    if (wallet && address) {
      // Update preferred wallet when wallet changes
      // In v5, wallet.id or wallet.name might be different
      setWalletPreferences((prev: WalletPreferences) => ({
        ...prev,
        preferredWallet: wallet.id || 'unknown'
      }));
    }
  }, [wallet, address, setWalletPreferences]);

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    const shouldAutoConnect = walletPreferences.autoConnect && 
                            walletPreferences.preferredWallet &&
                            !authState.isConnected &&
                            connectionStatus === 'disconnected';

    if (shouldAutoConnect) {
      // Check if last connection was recent (within 24 hours)
      const lastConnected = walletPreferences.lastConnectedTimestamp;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const isRecentConnection = Date.now() - lastConnected < twentyFourHours;

      if (isRecentConnection && walletPreferences.preferredWallet) {
        connectWallet(walletPreferences.preferredWallet);
      }
    }
  }, [walletPreferences, authState.isConnected, connectionStatus, connectWallet]);

  // ============ Utility Functions ============
  /**
   * Get formatted wallet address for display
   */
  const getDisplayAddress = useCallback((addr?: string) => {
    const targetAddress = addr || address;
    if (!targetAddress) return '';
    
    return `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;
  }, [address]);

  /**
   * Check if user has been connected recently
   */
  const hasRecentConnection = useCallback(() => {
    const lastConnected = walletPreferences.lastConnectedTimestamp;
    const oneHour = 60 * 60 * 1000;
    return Date.now() - lastConnected < oneHour;
  }, [walletPreferences.lastConnectedTimestamp]);

  /**
   * Get wallet connection info
   */
  const getWalletInfo = useCallback(() => {
    if (!wallet) return null;

    // In v5, wallet properties might be different
    return {
      name: wallet.id || 'Unknown',
      iconUrl: undefined // v5 might not have iconURL in the same way
    };
  }, [wallet]);

  // ============ Return Hook Interface ============
  return {
    // Auth State
    ...authState,
    connectionError,
    walletPreferences,

    // Connection Functions
    connectWallet,
    disconnectWallet,
    toggleAutoConnect,
    clearAuthData,

    // Utility Functions
    getDisplayAddress,
    hasRecentConnection,
    getWalletInfo,

    // Thirdweb Direct Access (for advanced usage)
    wallet,
    connectionStatus
  };
}