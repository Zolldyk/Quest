'use client';

import { useState, useEffect } from 'react';
import { useContractValidation } from '../../hooks/useContracts';
import { useActiveAccount } from 'thirdweb/react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * Component to display contract configuration and connection status
 */
export default function ContractStatus() {
  const { isValid, missingAddresses, addresses } = useContractValidation();
  const account = useActiveAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'checking' | 'connected' | 'error' | 'ready'>>({});

  // Test contract connections
  useEffect(() => {
    const testConnections = async () => {
      const contracts = ['stakingPool', 'questManager', 'nftMinter', 'usdcToken'];
      const status: Record<string, 'checking' | 'connected' | 'error' | 'ready'> = {};
      
      for (const contract of contracts) {
        const address = addresses[contract as keyof typeof addresses];
        
        if (!address || address === '' || address === 'undefined') {
          status[contract] = 'error';
          continue;
        }
        
        if (!account) {
          status[contract] = 'ready';
          continue;
        }
        
        status[contract] = 'checking';
        setConnectionStatus(prev => ({ ...prev, ...status }));
        
        try {
          // Test basic contract connection with thirdweb v5
          const { getContract } = await import('thirdweb');
          const { client, getActiveChain } = await import('../../hooks/useThirdwebV5');
          
          const contractInstance = getContract({
            client,
            chain: getActiveChain(),
            address,
          });
          
          // Simple validation - just check if we can create the contract instance
          if (contractInstance) {
            status[contract] = 'connected';
          } else {
            status[contract] = 'error';
          }
        } catch (error) {
          console.warn(`Contract connection test failed for ${contract}:`, error);
          status[contract] = 'error';
        }
      }
      
      setConnectionStatus(status);
    };
    
    testConnections();
  }, [addresses, account]);

  // Don't show anything if contracts are configured properly - let the actual data fetching determine success
  if (isValid) {
    return null;
  }

  return (
    <div className="mb-6">
      <div 
        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">
              {!account 
                ? 'Connect wallet to test contracts'
                : missingAddresses.length > 0 
                  ? `Missing contract addresses (${missingAddresses.length})`
                  : 'Contract connection issues'
              }
            </span>
          </div>
          <ArrowPathIcon 
            className={`h-4 w-4 text-yellow-600 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Contract Status</h4>
          <div className="space-y-2">
            {Object.entries(addresses).map(([name, address]) => {
              const status = connectionStatus[name] || 'checking';
              const isMissing = !address || address === '' || address === 'undefined';
              
              return (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center">
                    {isMissing ? (
                      <>
                        <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-red-600">Not configured</span>
                      </>
                    ) : !account ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-blue-600">Ready (wallet needed)</span>
                      </>
                    ) : status === 'checking' ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 text-yellow-500 mr-1 animate-spin" />
                        <span className="text-yellow-600">Checking...</span>
                      </>
                    ) : status === 'connected' ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : status === 'ready' ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-blue-600">Ready</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-red-600">Connection failed</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {missingAddresses.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-gray-700">
                <strong>Missing addresses:</strong> {missingAddresses.join(', ')}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Please check your environment variables and ensure all contract addresses are configured.
              </p>
            </div>
          )}

          {!account && (
            <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-700">
                <strong>Wallet Required:</strong> Connect your wallet to test contract connections and access full functionality.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}