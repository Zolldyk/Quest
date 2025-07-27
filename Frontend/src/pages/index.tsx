// ============ Imports ============
import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { 
  CurrencyDollarIcon, 
  TrophyIcon, 
  UsersIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { WalletProtected } from '../components/wallet/WalletConnection';
import PoolStats from '../components/stats/PoolStats';
import { useAuth } from '../hooks/useAuth';
import { useContracts } from '../hooks/useContracts';

// ============ Home Page Component ============
/**
 * @title Home Page
 * @notice Landing page showcasing Quest dApp features and current stats
 * @dev Displays quest overview, pool stats, and CTAs for user actions
 */
const HomePage: NextPage = () => {
  // ============ Hooks ============
  const { isConnected, address } = useAuth();
  const { stakingPool, questManager } = useContracts();

  // ============ State ============
  const [stats, setStats] = useState({
    totalStaked: '0',
    totalQuests: '0',
    totalParticipants: '0',
    isLoading: true
  });

  // ============ Functions ============
  /**
   * Load basic stats for the home page
   */
  const loadStats = useCallback(async () => {
    if (!stakingPool || !questManager) return;

    try {
      // Get pool balance
      const poolBalance = stakingPool.poolBalance || '0';
      
      // Get active quests count
      const activeQuests = questManager.activeQuests || [];
      
      setStats({
        totalStaked: poolBalance.toString(),
        totalQuests: activeQuests.length.toString() || '1',
        totalParticipants: '0', // Simplified for now
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [stakingPool, questManager]);

  // ============ Effects ============
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <>
      <Head>
        <title>Quest - DeFi NFT Quest Game</title>
        <meta 
          name="description" 
          content="Complete community quests, earn tokens, and mint unique NFT badges on Etherlink L2" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                Complete Quests,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Earn Rewards
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join the community-driven quest game where your participation earns you tokens 
                and unique NFT badges. Powered by Etherlink&apos;s lightning-fast transactions.
              </p>

              {/* Connection Status */}
              <div className="mb-8">
                {isConnected ? (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                ) : (
                  <WalletProtected>Connect Wallet</WalletProtected>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/quests"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Start Quest
                  <ArrowRightIcon className="ml-2 -mr-1 w-5 h-5" />
                </Link>
                
                <Link 
                  href="/staking"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Fund Pool
                  <CurrencyDollarIcon className="ml-2 -mr-1 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Quest Stats
              </h2>
              <p className="text-lg text-gray-600">
                Live statistics from the Etherlink blockchain
              </p>
            </div>

            <PoolStats />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Total Staked */}
              <div className="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {stats.isLoading ? '...' : `$${parseFloat(stats.totalStaked).toFixed(2)}`}
                </h3>
                <p className="text-gray-600">Total Staked</p>
              </div>

              {/* Active Quests */}
              <div className="text-center p-6 rounded-lg bg-purple-50 border border-purple-200">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {stats.totalQuests}
                </h3>
                <p className="text-gray-600">Active Quests</p>
              </div>

              {/* Participants */}
              <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-600 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {stats.isLoading ? '...' : stats.totalParticipants}
                </h3>
                <p className="text-gray-600">Participants</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600">
                Simple steps to earn rewards and mint NFTs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Complete Quest
                </h3>
                <p className="text-gray-600">
                  Post a tweet with #EtherlinkQuest and submit the URL to prove completion
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Get Verified
                </h3>
                <p className="text-gray-600">
                  Admin verifies your submission and approves the quest completion
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Earn Rewards
                </h3>
                <p className="text-gray-600">
                  Instantly receive 1 USDC reward and mint a unique NFT badge
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Quest?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                  ⚡
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Instant Rewards
                </h3>
                <p className="text-gray-600 text-sm">
                  Get paid instantly with Etherlink&apos;s &lt;500ms confirmations
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                  💰
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Low Fees
                </h3>
                <p className="text-gray-600 text-sm">
                  Minimal transaction costs on Etherlink L2
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
                  🎨
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unique NFTs
                </h3>
                <p className="text-gray-600 text-sm">
                  Collect limited NFT badges as proof of completion
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-lg flex items-center justify-center">
                  🤝
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Community Driven
                </h3>
                <p className="text-gray-600 text-sm">
                  Funded by community staking pool
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;