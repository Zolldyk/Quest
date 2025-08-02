// ============ Imports ============
'use client';

import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import dynamic from 'next/dynamic';
import OptimizedLayout from '../components/layout/OptimizedLayout';
import { QuestsSkeleton } from '../components/ui/SkeletonLoader';
import { LazyWrapper } from '../components/ui/LazyWrapper';
import WalletConnectionV5 from '../components/wallet/WalletConnectionV5';
import { TrophyIcon } from '@heroicons/react/24/outline';

// Dynamically import heavy components
const QuestDisplay = dynamic(() => import('../components/quests/QuestDisplay'), {
  ssr: false,
  loading: () => <QuestsSkeleton />
});

const QuestSubmissionForm = dynamic(() => import('../components/quests/QuestSubmissionForm'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
  )
});

// ============ Quests Page Component ============
/**
 * @title Quests Page
 * @notice Page for users to view and complete available quests
 * @dev Displays quest information, submission form, and user guidance
 */
export default function QuestsPage() {
  // ============ Hooks ============
  const account = useActiveAccount();
  const isConnected = !!account;
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  return (
    <OptimizedLayout 
      title="Complete Quests" 
      description="Complete the community quest to earn 1 USDC reward and mint a unique NFT badge. Fast payouts powered by Etherlink's instant transactions."
    >
      {/* Connection Check */}
      {!isConnected && (
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-4">
              Connect your wallet to participate in quests and earn rewards
            </p>
            <WalletConnectionV5 variant="default" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quest Information */}
        <div className="lg:col-span-2">
          <LazyWrapper fallback={<QuestsSkeleton />}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Quest
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Complete the quest below to earn rewards
                </p>
              </div>
              <div className="p-6">
                <QuestDisplay />
              </div>
            </div>
          </LazyWrapper>

          {/* Quest Action Button */}
          {isConnected && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Ready to Submit?
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Complete the quest and submit your proof to earn rewards
                </p>
              </div>
              <div className="p-6">
                <button
                  onClick={() => setShowSubmissionForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <TrophyIcon className="h-5 w-5 mr-2" />
                  Submit Quest Proof
                </button>
              </div>
            </div>
          )}
          
          {/* Quest Submission Form Modal */}
          {showSubmissionForm && (
            <QuestSubmissionForm 
              quest={{
                questId: BigInt(1),
                title: "Twitter Quest",
                description: "Share about Quest dApp on Twitter",
                requirements: "Post with #EtherlinkQuest hashtag and mention @QuestDapp",
                rewardAmount: BigInt(1000000), // 1 USDC in microUSDC (6 decimals)
                isActive: true,
                startTime: BigInt(Date.now()),
                endTime: BigInt(Date.now() + 86400000),
                maxCompletions: BigInt(1000),
                currentCompletions: BigInt(0),
                creator: "0x0000000000000000000000000000000000000000",
                createTime: BigInt(Date.now())
              }}
              onClose={() => setShowSubmissionForm(false)}
              onSuccess={() => {
                setShowSubmissionForm(false);
              }}
            />
          )}
        </div>

        {/* Quest Guide - Static content loads immediately */}
        <div className="lg:col-span-1">
          {/* How to Complete */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                How to Complete
              </h2>
            </div>
            <div className="p-6">
              <ol className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                    1
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">Post Tweet</div>
                    <div>Create a tweet with #EtherlinkQuest hashtag and tag the dApp account</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                    2
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">Copy URL</div>
                    <div>Copy the direct link to your tweet</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                    3
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">Submit</div>
                    <div>Paste the tweet URL in the form and submit</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                    4
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">Get Rewarded</div>
                    <div>Receive 1 USDC + NFT badge after verification</div>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Reward Info */}
          <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🎁 Quest Rewards
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Token Reward</span>
                <span className="text-sm font-bold text-green-600">1 USDC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">NFT Badge</span>
                <span className="text-sm font-bold text-blue-600">Unique</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Verification</span>
                <span className="text-sm font-bold text-purple-600">Manual</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Requirements
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Connected wallet
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Twitter account
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Valid tweet URL
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Use #EtherlinkQuest hashtag
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  💡 Pro Tips
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Make your tweet creative and engaging</li>
                    <li>Include your wallet address for faster verification</li>
                    <li>Verification typically takes 5-10 minutes</li>
                    <li>One quest completion per wallet address</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OptimizedLayout>
  );
}