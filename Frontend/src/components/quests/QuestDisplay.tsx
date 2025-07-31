'use client';

// ============ Imports ============
import { useState, useEffect } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import { 
  TrophyIcon,
  ClockIcon, 
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { useQuestManager, formatTokenAmount, Quest } from '../../hooks/useContracts';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';
import QuestSubmissionForm from './QuestSubmissionForm';

// ============ Types ============
interface QuestDisplayProps {
  className?: string;
}

interface QuestCardProps {
  quest: Quest;
  userAddress?: string;
  hasCompleted: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

/**
 * @title QuestDisplay
 * @notice Component that displays available quests and handles submissions
 * @dev Shows active quests with real-time completion status
 */
export default function QuestDisplay({ className = "" }: QuestDisplayProps) {

  // ============ Hooks ============
  const address = useAddress();
  const { 
    activeQuests,
    defaultQuestId,
    getQuest,
    hasPlayerCompleted,
    refetchActiveQuests 
  } = useQuestManager();

  // ============ State ============
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // ============ Effects ============

  // Fetch quest details when active quests change
  useEffect(() => {
    const fetchQuestDetails = async () => {
      console.log('🔍 QuestDisplay: Starting fetchQuestDetails', {
        activeQuests,
        activeQuestsType: typeof activeQuests,
        isArray: Array.isArray(activeQuests),
        defaultQuestId
      });
      
      setIsLoading(true);
      
      try {
        // Try to get active quests, but provide fallback behavior
        let questIds: any[] = [];
        
        try {
          if (Array.isArray(activeQuests)) {
            questIds = activeQuests;
            console.log('✅ QuestDisplay: Got active quests array:', questIds);
          } else if (activeQuests && typeof activeQuests === 'object') {
            // Handle case where activeQuests might be wrapped in an object
            questIds = Object.values(activeQuests);
            console.log('✅ QuestDisplay: Got active quests object values:', questIds);
          } else {
            console.warn('⚠️ QuestDisplay: activeQuests is not array or object:', activeQuests);
          }
        } catch (error) {
          console.warn('❌ QuestDisplay: Error processing activeQuests:', error);
        }

        // If no active quests from contract, show default quest
        if (questIds.length === 0) {
          console.log('⚠️ QuestDisplay: No active quests from contract, using fallback quest');
          // Provide a default/mock quest for demonstration
          const defaultQuest: Quest = {
            questId: defaultQuestId || BigInt(1),
            title: "Twitter Quest: Share about Quest dApp",
            description: "Help spread the word about Quest dApp by sharing on Twitter",
            requirements: "Post a tweet mentioning @QuestDApp with #EtherlinkQuest hashtag and include what you love about decentralized quest platforms",
            rewardAmount: BigInt(1000000), // 1 USDC (6 decimals)
            isActive: true,
            startTime: BigInt(Math.floor(Date.now() / 1000) - 86400), // Started yesterday
            endTime: BigInt(Math.floor(Date.now() / 1000) + 30 * 86400), // Ends in 30 days
            maxCompletions: BigInt(1000),
            currentCompletions: BigInt(0),
            creator: "0x0000000000000000000000000000000000000000",
            createTime: BigInt(Math.floor(Date.now() / 1000) - 86400),
          };
          
          setQuests([defaultQuest]);
          setIsLoading(false);
          return;
        }

        // Fetch quest details with individual error handling
        const questPromises = questIds.map(async (questId: any) => {
          try {
            const quest = await getQuest(Number(questId));
            return quest;
          } catch (error) {
            console.warn(`Failed to fetch quest ${questId}:`, error);
            return null;
          }
        });

        const questDetails = await Promise.all(questPromises);
        const validQuests = questDetails.filter(quest => quest !== null) as Quest[];
        
        setQuests(validQuests);
        
        // Check completion status for each quest if user is connected
        if (address && validQuests.length > 0) {
          try {
            const completionPromises = validQuests.map(async (quest) => {
              try {
                const completed = await hasPlayerCompleted(address, Number(quest.questId));
                return [quest.questId.toString(), completed] as const;
              } catch (error) {
                console.warn(`Failed to check completion for quest ${quest.questId}:`, error);
                return [quest.questId.toString(), false] as const;
              }
            });
            
            const completionChecks = await Promise.all(completionPromises);
            const completionMap = Object.fromEntries(completionChecks);
            setCompletionStatus(completionMap);
          } catch (error) {
            console.warn('Error checking quest completion status:', error);
          }
        }
        
      } catch (error) {
        console.error('Error fetching quest details:', error);
        // Provide fallback quest on error to prevent complete failure
        const fallbackQuest: Quest = {
          questId: BigInt(1),
          title: "Welcome Quest",
          description: "Complete your first social media quest to get started with Quest dApp",
          requirements: "Share about Quest dApp on Twitter with #EtherlinkQuest hashtag",
          rewardAmount: BigInt(1000000), // 1 USDC
          isActive: true,
          startTime: BigInt(Math.floor(Date.now() / 1000) - 86400),
          endTime: BigInt(Math.floor(Date.now() / 1000) + 30 * 86400),
          maxCompletions: BigInt(1000),
          currentCompletions: BigInt(0),
          creator: "0x0000000000000000000000000000000000000000",
          createTime: BigInt(Math.floor(Date.now() / 1000) - 86400),
        };
        setQuests([fallbackQuest]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestDetails();
  }, [activeQuests, address, defaultQuestId]);

  // ============ Handlers ============

  const handleQuestSubmit = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowSubmissionForm(true);
  };

  const handleSubmissionComplete = () => {
    setShowSubmissionForm(false);
    setSelectedQuest(null);
    
    // Refresh quest data
    refetchActiveQuests();
    
    // Refresh completion status
    if (address && quests.length > 0) {
      quests.forEach(async (quest) => {
        const completed = await hasPlayerCompleted(address, Number(quest.questId));
        setCompletionStatus(prev => ({
          ...prev,
          [quest.questId.toString()]: completed
        }));
      });
    }
  };

  // ============ Loading State ============
  if (isLoading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // ============ Empty State ============
  if (!quests.length) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="text-center py-12">
          <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Quests
          </h3>
          <p className="text-gray-600">
            Check back later for new quests to complete!
          </p>
        </div>
      </div>
    );
  }

  // ============ JSX Return ============
  return (
    <>
      <div className={`max-w-6xl mx-auto p-6 ${className}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Quests</h1>
          <p className="text-gray-600">
            Complete social media quests to earn USDC rewards and NFT badges
          </p>
        </div>

        {/* Quest Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <QuestCard
              key={quest.questId.toString()}
              quest={quest}
              userAddress={address}
              hasCompleted={completionStatus[quest.questId.toString()] || false}
              canSubmit={!!address && !completionStatus[quest.questId.toString()]}
              onSubmit={() => handleQuestSubmit(quest)}
            />
          ))}
        </div>

        {/* How to Complete Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            How to Complete Quests
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Connect Wallet</h4>
              <p className="text-gray-600 text-sm">
                Connect your Web3 wallet to participate in quests
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Complete Task</h4>
              <p className="text-gray-600 text-sm">
                Follow the quest requirements (e.g., post tweet with hashtag)
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Submit Proof</h4>
              <p className="text-gray-600 text-sm">
                Submit the URL of your post as proof of completion
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Get Rewards</h4>
              <p className="text-gray-600 text-sm">
                Receive USDC tokens and mint an NFT badge after verification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionForm && selectedQuest && (
        <QuestSubmissionForm
          quest={selectedQuest}
          onClose={() => setShowSubmissionForm(false)}
          onSuccess={handleSubmissionComplete}
        />
      )}
    </>
  );
}

// ============ Quest Card Component ============
function QuestCard({ 
  quest, 
  userAddress, 
  hasCompleted, 
  canSubmit, 
  onSubmit 
}: QuestCardProps) {

  // Calculate quest progress
  const progressPercentage = quest.maxCompletions > BigInt(0) 
    ? (Number(quest.currentCompletions) / Number(quest.maxCompletions)) * 100
    : 0;

  // Check if quest is full
  const isFull = quest.currentCompletions >= quest.maxCompletions;
  
  // Check if quest is expired
  const isExpired = Date.now() > Number(quest.endTime) * 1000;

  // Determine card status
  const getCardStatus = () => {
    if (hasCompleted) return 'completed';
    if (isExpired) return 'expired';
    if (isFull) return 'full';
    if (!userAddress) return 'connect-required';
    return 'available';
  };

  const status = getCardStatus();

  // Status styling
  const statusStyles = {
    completed: 'border-green-200 bg-green-50',
    expired: 'border-gray-200 bg-gray-50',
    full: 'border-orange-200 bg-orange-50',
    'connect-required': 'border-gray-200 bg-white',
    available: 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100',
  };

  return (
    <div className={`
      relative bg-white rounded-xl shadow-card border-2 p-6 transition-all duration-200
      ${statusStyles[status]}
    `}>
      
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {hasCompleted && (
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Completed
          </div>
        )}
        {isExpired && !hasCompleted && (
          <div className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
            Expired
          </div>
        )}
        {isFull && !hasCompleted && !isExpired && (
          <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
            Full
          </div>
        )}
      </div>

      {/* Quest Header */}
      <div className="mb-4 pr-20">
        <div className="flex items-center mb-2">
          <TrophyIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {quest.title}
          </h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          {quest.description}
        </p>
      </div>

      {/* Quest Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-700">
          <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-2" />
          <span className="font-medium">
            {formatTokenAmount(quest.rewardAmount, 6)} USDC Reward
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-700">
          <UsersIcon className="h-4 w-4 text-blue-500 mr-2" />
          <span>
            {quest.currentCompletions.toString()}/{quest.maxCompletions.toString()} completed
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-700">
          <ClockIcon className="h-4 w-4 text-purple-500 mr-2" />
          <span>
            {isExpired ? 'Expired' : `Ends ${new Date(Number(quest.endTime) * 1000).toLocaleDateString()}`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
          {quest.requirements}
        </div>
        
        {/* Quick hashtag reference for social media quests */}
        {quest.requirements.includes('#EtherlinkQuest') && (
          <div className="mt-2 flex items-center text-xs text-blue-600">
            <HashtagIcon className="h-3 w-3 mr-1" />
            <span className="font-mono bg-blue-50 px-1 py-0.5 rounded">
              #EtherlinkQuest
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="space-y-2">
        {!userAddress ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">Connect wallet to participate</p>
          </div>
        ) : hasCompleted ? (
          <button 
            className="w-full bg-green-100 text-green-800 font-medium py-3 px-4 rounded-lg cursor-default"
            disabled
          >
            <CheckCircleIcon className="h-4 w-4 inline mr-2" />
            Quest Completed
          </button>
        ) : isExpired ? (
          <button 
            className="w-full bg-gray-100 text-gray-500 font-medium py-3 px-4 rounded-lg cursor-default"
            disabled
          >
            Quest Expired
          </button>
        ) : isFull ? (
          <button 
            className="w-full bg-orange-100 text-orange-800 font-medium py-3 px-4 rounded-lg cursor-default"
            disabled
          >
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-2" />
            Maximum Completions Reached
          </button>
        ) : (
          <button
            onClick={onSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
            Start Quest
          </button>
        )}
        
        {/* Additional info for quest requirements */}
        {canSubmit && quest.requirements.includes('twitter.com') && (
          <div className="text-xs text-gray-500 text-center">
            Complete the task on social media, then submit proof here
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Quest Statistics Component ============
interface QuestStatsProps {
  quests: Quest[];
  userCompletions: number;
}

export function QuestStats({ quests, userCompletions }: QuestStatsProps) {
  const totalQuests = quests.length;
  const totalCompletions = quests.reduce((sum, quest) => sum + Number(quest.currentCompletions), 0);
  const totalRewards = quests.reduce((sum, quest) => sum + (Number(quest.rewardAmount) * Number(quest.currentCompletions)), 0);

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quest Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalQuests}</div>
          <div className="text-sm text-gray-600">Active Quests</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalCompletions}</div>
          <div className="text-sm text-gray-600">Total Completions</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatTokenAmount({ _hex: totalRewards.toString(16), _isBigNumber: true } as any, 6)}
          </div>
          <div className="text-sm text-gray-600">USDC Distributed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{userCompletions}</div>
          <div className="text-sm text-gray-600">Your Completions</div>
        </div>
      </div>
    </div>
  );
}

// ============ Empty Quest State ============
export function EmptyQuestState() {
  return (
    <div className="text-center py-16">
      <TrophyIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Quests Available
      </h3>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        There are currently no active quests. New quests are added regularly, 
        so check back soon for opportunities to earn rewards!
      </p>
      
      <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TrophyIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-left text-sm text-blue-800">
            <p className="font-medium mb-1">Want to create quests?</p>
            <p>
              Quest creators and community members can propose new quests. 
              Join our Discord to get involved!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}