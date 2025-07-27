// ============ Imports ============
import { NextPage } from 'next';
import Head from 'next/head';
import QuestDisplay from '../components/quests/QuestDisplay';
import QuestSubmissionForm from '../components/quests/QuestSubmissionForm';
import { WalletProtected } from '../components/wallet/WalletConnection';
import { useAuth } from '../hooks/useAuth';

// ============ Quests Page Component ============
/**
 * @title Quests Page
 * @notice Page for users to view and complete available quests
 * @dev Displays quest information, submission form, and user guidance
 */
const QuestsPage: NextPage = () => {
  // ============ Hooks ============
  const { isConnected } = useAuth();

  return (
    <>
      <Head>
        <title>Complete Quests - Quest</title>
        <meta 
          name="description" 
          content="Complete community quests, earn USDC rewards, and mint unique NFT badges" 
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Quests
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Complete the community quest to earn 1 USDC reward and mint a unique NFT badge. 
              Fast payouts powered by Etherlink&apos;s instant transactions.
            </p>
          </div>

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
                <WalletProtected>Connect Wallet</WalletProtected>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quest Information */}
            <div className="lg:col-span-2">
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

              {/* Quest Submission */}
              {isConnected && (
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Submit Quest
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Provide proof of quest completion to claim your reward
                    </p>
                  </div>
                  <div className="p-6">
                    <QuestSubmissionForm 
                      quest={{
                        questId: { toNumber: () => 1 },
                        title: "Twitter Quest",
                        description: "Share about Quest dApp on Twitter",
                        requirements: "Post with #EtherlinkQuest",
                        rewardAmount: { toNumber: () => 1000000 },
                        isActive: true,
                        startTime: { toNumber: () => Date.now() },
                        endTime: { toNumber: () => Date.now() + 86400000 },
                        maxCompletions: { toNumber: () => 1000 },
                        currentCompletions: { toNumber: () => 0 },
                        creator: "0x0000000000000000000000000000000000000000",
                        createTime: { toNumber: () => Date.now() }
                      } as any}
                      onClose={() => {}}
                      onSuccess={() => {
                        // Refresh page or show success message
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quest Guide */}
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
        </div>
      </div>
    </>
  );
};

export default QuestsPage;