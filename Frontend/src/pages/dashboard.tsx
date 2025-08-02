// ============ Imports ============
'use client';

import { useActiveAccount } from 'thirdweb/react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import OptimizedLayout from '../components/layout/OptimizedLayout';
import { DashboardSkeleton, NFTGallerySkeleton } from '../components/ui/SkeletonLoader';
import { LazyWrapper } from '../components/ui/LazyWrapper';
import { UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Dynamically import heavy components with optimized loading
const UserDashboard = dynamic(() => import('../components/dashboard/UserDashboard'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const StakesSummary = dynamic(() => import('../components/dashboard/StakesSummary'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
    </div>
  )
});

const SubmissionHistory = dynamic(() => import('../components/dashboard/SubmissionHistory'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-12 w-full rounded"></div>
      ))}
    </div>
  )
});

const NFTGallery = dynamic(() => import('../components/nft/NFTGallery'), {
  ssr: false,
  loading: () => <NFTGallerySkeleton />
});

// ============ Dashboard Page Component ============
/**
 * @title Dashboard Page
 * @notice User dashboard showing stakes, quest history, and NFT collection
 * @dev Displays comprehensive user data and activity overview
 */
export default function DashboardPage() {
  // ============ Hooks ============
  const account = useActiveAccount();
  const isConnected = !!account;
  const address = account?.address;
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // If not connected, show lightweight connection prompt
  if (!isConnected) {
    return (
      <OptimizedLayout 
        title="Dashboard" 
        description="Track your quest activity, stakes, and NFT collection"
        showWalletPrompt={false}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to view your dashboard, quest history, and NFT collection
            </p>
          </div>
        </div>
      </OptimizedLayout>
    );
  }

  return (
    <OptimizedLayout 
      title="Dashboard" 
      description="Track your quest activity, stakes, and NFT collection"
    >
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome back!
            </h2>
            <p className="text-sm text-gray-600">
              Connected as {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Dashboard */}
        <div className="lg:col-span-2 space-y-8">
          {/* User Overview */}
          <LazyWrapper fallback={<DashboardSkeleton />}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Overview
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your quest activity and rewards summary
                </p>
              </div>
              <div className="p-6">
                {isClient ? <UserDashboard /> : <DashboardSkeleton />}
              </div>
            </div>
          </LazyWrapper>

          {/* Quest History */}
          <LazyWrapper>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Quest History
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your quest submissions and their status
                </p>
              </div>
              <div className="p-6">
                <SubmissionHistory />
              </div>
            </div>
          </LazyWrapper>

          {/* NFT Collection */}
          <LazyWrapper fallback={<NFTGallerySkeleton />}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  NFT Collection
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your earned quest badges and NFTs
                </p>
              </div>
              <div className="p-6">
                <NFTGallery />
              </div>
            </div>
          </LazyWrapper>
        </div>

        {/* Right Column - Stakes & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stakes Summary */}
          <LazyWrapper>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Stakes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  USDC staked in the quest pool
                </p>
              </div>
              <div className="p-6">
                <StakesSummary />
              </div>
            </div>
          </LazyWrapper>

          {/* Quick Actions - Load immediately for better UX */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Actions
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href="/quests"
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete Quest
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/staking"
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Stake USDC
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Achievement Stats - Static content loads fast */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏆 Achievements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Quests Completed</span>
                <span className="text-sm font-bold text-purple-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">NFTs Earned</span>
                <span className="text-sm font-bold text-pink-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Rewards Earned</span>
                <span className="text-sm font-bold text-green-600">- USDC</span>
              </div>
            </div>
          </div>

          {/* Help & Support - Static content */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Having trouble with quests or need assistance?
            </p>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                📖 Documentation
              </a>
              <a
                href="#"
                className="block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                💬 Discord Support
              </a>
              <a
                href="#"
                className="block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                📧 Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </OptimizedLayout>
  );
}