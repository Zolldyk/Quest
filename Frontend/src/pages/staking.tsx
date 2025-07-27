// ============ Imports ============
'use client';

import { useActiveAccount } from 'thirdweb/react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import WalletConnectionV5 from '../components/wallet/WalletConnectionV5';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Dynamically import components that use contracts to avoid SSR issues
const StakingInterface = dynamic(() => import('../components/staking/StakingInterface'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

const PoolStats = dynamic(() => import('../components/stats/PoolStats'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

// ============ Staking Page Component ============
/**
 * @title Staking Page
 * @notice Page for users to stake USDC into the quest reward pool
 * @dev Displays staking interface, pool statistics, and connection status
 */
export default function StakingPage() {
  // ============ Hooks ============
  const account = useActiveAccount();
  const isConnected = !!account;
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Stake USDC
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fund the community quest pool by staking USDC. Your contributions help 
              reward participants who complete quests and earn NFT badges.
            </p>
          </div>

          {/* Connection Check */}
          {!isConnected && (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Wallet Connection Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please connect your wallet to stake USDC.</p>
                    </div>
                    <div className="mt-4">
                      <WalletConnectionV5 variant="compact" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Staking Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Staking Pool
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Stake or unstake USDC to participate in funding community quests
                  </p>
                </div>
                <div className="p-6">
                  <ErrorBoundary>
                    {isClient ? <StakingInterface /> : <LoadingSpinner />}
                  </ErrorBoundary>
                </div>
              </div>

              {/* Information Cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* How Staking Works */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    How Staking Works
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        1
                      </span>
                      Stake USDC to fund the quest reward pool
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        2
                      </span>
                      Your funds help reward quest participants
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        3
                      </span>
                      Unstake anytime with no penalties
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        4
                      </span>
                      Support community engagement and growth
                    </li>
                  </ul>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Benefits
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      No lock-up period
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Instant transactions on Etherlink
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Low gas fees
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Support community growth
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pool Statistics */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pool Statistics
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Real-time pool data
                  </p>
                </div>
                <div className="p-6">
                  <ErrorBoundary>
                    {isClient ? <PoolStats /> : <LoadingSpinner />}
                  </ErrorBoundary>
                </div>
              </div>

              {/* Risk Notice */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Important Notice
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        This is a testnet deployment. Only stake tokens you can afford to lose. 
                        The smart contracts are for demonstration purposes only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}