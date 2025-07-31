'use client';

// ============ Imports ============
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import { 
  CurrencyDollarIcon,
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  EyeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useContracts, formatTokenAmount, QuestSubmission } from '../../hooks/useContracts';
import { CardSkeleton } from '../ui/LoadingSpinner';
import StakesSummary from './StakesSummary';
import SubmissionHistory from './SubmissionHistory';

// ============ Types ============
interface DashboardStats {
  totalStaked: string;
  totalEarned: string;
  questsCompleted: number;
  nftBadges: number;
  pendingSubmissions: number;
}

interface TabProps {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

/**
 * @title UserDashboard
 * @notice Main dashboard component showing user's activity and stats
 * @dev Provides comprehensive overview of user's Quest dApp engagement
 */
export default function UserDashboard() {

  // ============ Hooks ============
  const address = useAddress();
  const { stakingPool, questManager, nftMinter } = useContracts();

  // ============ State ============
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<QuestSubmission[]>([]);

  // Memoize contract readiness to avoid unnecessary re-renders
  const contractsReady = useMemo(() => {
    return !!(stakingPool.contract && questManager.contract && nftMinter.contract);
  }, [stakingPool.contract, questManager.contract, nftMinter.contract]);

  // ============ Tab Configuration ============
  const tabs: TabProps[] = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'staking', name: 'Staking', icon: CurrencyDollarIcon },
    { id: 'quests', name: 'Quest History', icon: TrophyIcon, count: stats?.questsCompleted },
    { id: 'nfts', name: 'NFT Badges', icon: StarIcon, count: stats?.nftBadges },
  ];

  // ============ Effects ============

  // Fetch user dashboard data with optimized parallel loading
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!address) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Check if contracts are available before proceeding
      if (!contractsReady) {
        console.warn('Contracts not yet available, setting default stats');
        setStats({
          totalStaked: '0',
          totalEarned: '0',
          questsCompleted: 0,
          nftBadges: 0,
          pendingSubmissions: 0,
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Execute all contract calls in parallel for better performance
        const [stakerInfoResult, submissionIdsResult, badgeCountResult] = await Promise.allSettled([
          stakingPool.getStakerInfo(address).catch(error => {
            console.warn('Failed to fetch staker info:', error);
            return null;
          }),
          questManager.getPlayerSubmissions(address).catch(error => {
            console.warn('Failed to fetch user submissions:', error);
            return [];
          }),
          nftMinter.getUserBadges(address).catch(error => {
            console.warn('Failed to fetch user badges:', error);
            return [];
          })
        ]);

        // Extract results
        const stakerInfo = stakerInfoResult.status === 'fulfilled' ? stakerInfoResult.value : null;
        const submissionIds = submissionIdsResult.status === 'fulfilled' ? submissionIdsResult.value : [];
        const userBadges = badgeCountResult.status === 'fulfilled' ? badgeCountResult.value : [];

        // Fetch submissions in parallel (limit to prevent rate limiting)
        let validSubmissions: QuestSubmission[] = [];
        if (submissionIds && submissionIds.length > 0) {
          // Limit to last 10 submissions for performance
          const recentIds = submissionIds.slice(-10);
          const submissionResults = await Promise.allSettled(
            recentIds.map((id: any) => 
              questManager.getSubmission(Number(id)).catch(error => {
                console.warn(`Failed to fetch submission ${id}:`, error);
                return null;
              })
            )
          );
          
          validSubmissions = submissionResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<QuestSubmission>).value);
        }
        
        setRecentSubmissions(validSubmissions.slice(-5)); // Last 5 submissions

        // Calculate stats
        const completedCount = validSubmissions.filter(s => s.status === 1).length;
        const totalEarnedAmount = completedCount * 1; // 1 USDC per quest (simplified)
        const pendingCount = validSubmissions.filter(s => s.status === 0).length;

        const dashboardStats: DashboardStats = {
          totalStaked: formatTokenAmount(stakerInfo?.stakedAmount || BigInt(0), 6),
          totalEarned: totalEarnedAmount.toString(),
          questsCompleted: completedCount,
          nftBadges: userBadges?.length || 0,
          pendingSubmissions: pendingCount,
        };

        setStats(dashboardStats);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default stats on error to prevent complete failure
        setStats({
          totalStaked: '0',
          totalEarned: '0',
          questsCompleted: 0,
          nftBadges: 0,
          pendingSubmissions: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [address, contractsReady, stakingPool.getStakerInfo, questManager.getPlayerSubmissions, nftMinter.getUserBadges]);

  // ============ JSX Return ============
  return (
    <div className="space-y-6">

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
              <StatCard
                title="Total Staked"
                value={`${stats?.totalStaked || '0'} USDC`}
                icon={<CurrencyDollarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              <StatCard
                title="Total Earned"
                value={`${stats?.totalEarned || '0'} USDC`}
                icon={<TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                bgColor="bg-green-50"
                textColor="text-green-600"
              />
              <StatCard
                title="Quests Completed"
                value={stats?.questsCompleted?.toString() || '0'}
                icon={<ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
                bgColor="bg-purple-50"
                textColor="text-purple-600"
              />
              <StatCard
                title="NFT Badges"
                value={stats?.nftBadges?.toString() || '0'}
                icon={<StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
                bgColor="bg-orange-50"
                textColor="text-orange-600"
              />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap sm:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`
                          ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs font-medium
                          ${activeTab === tab.id 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'overview' && (
                  <OverviewTab 
                    stats={stats} 
                    recentSubmissions={recentSubmissions}
                  />
                )}
                {activeTab === 'staking' && (
                  <StakesSummary />
                )}
                {activeTab === 'quests' && (
                  <SubmissionHistory />
                )}
                {activeTab === 'nfts' && (
                  <NFTBadgesTab />
                )}
              </div>
            </div>
          </>
        )}
    </div>
  );
}

// ============ Stat Card Component ============
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

function StatCard({ title, value, icon, bgColor, textColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className={`${bgColor} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-sm sm:text-lg lg:text-xl font-bold ${textColor} truncate`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============ Overview Tab ============
interface OverviewTabProps {
  stats: DashboardStats | null;
  recentSubmissions: QuestSubmission[];
  address?: string;
}

function OverviewTab({ stats, recentSubmissions }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <ActionCard
            title="Stake USDC"
            description="Fund the quest reward pool"
            href="/staking"
            icon={<CurrencyDollarIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="blue"
          />
          <ActionCard
            title="Browse Quests"
            description="Find new quests to complete"
            href="/quests"
            icon={<TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="green"
          />
          <ActionCard
            title="View NFTs"
            description="See your earned badges"
            href="#"
            onClick={() => {}} // Handle NFT gallery
            icon={<StarIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          {recentSubmissions.length > 0 && (
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Complete your first quest to get started!</p>
            </div>
          ) : (
            recentSubmissions.map((submission, index) => (
              <ActivityItem key={index} submission={submission} />
            ))
          )}
        </div>
      </div>

      {/* Account Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStaked}</p>
              <p className="text-sm text-gray-600">USDC Staked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.totalEarned}</p>
              <p className="text-sm text-gray-600">USDC Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.questsCompleted}</p>
              <p className="text-sm text-gray-600">Quests Done</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.nftBadges}</p>
              <p className="text-sm text-gray-600">NFT Badges</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Action Card Component ============
interface ActionCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
}

function ActionCard({ title, description, href, onClick, icon, color }: ActionCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300 text-blue-600',
    green: 'border-green-200 hover:border-green-300 text-green-600',
    purple: 'border-purple-200 hover:border-purple-300 text-purple-600',
  };

  const Component = href ? 'a' : 'button';
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      className={`
        block p-3 sm:p-4 border-2 rounded-lg transition-colors hover:bg-gray-50
        ${colorClasses[color]}
      `}
    >
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0">{icon}</div>
        <h4 className="ml-2 font-medium text-gray-900 text-sm sm:text-base truncate">{title}</h4>
      </div>
      <p className="text-xs sm:text-sm text-gray-600">{description}</p>
    </Component>
  );
}

// ============ Activity Item Component ============
interface ActivityItemProps {
  submission: QuestSubmission;
}

function ActivityItem({ submission }: ActivityItemProps) {
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-yellow-600 bg-yellow-50'; // PENDING
      case 1: return 'text-green-600 bg-green-50';   // COMPLETED
      case 2: return 'text-red-600 bg-red-50';       // REJECTED
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Completed';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <TrophyIcon className="h-5 w-5 text-gray-400 mr-3" />
        <div>
          <p className="font-medium text-gray-900">Quest #{submission.questId.toString()}</p>
          <p className="text-sm text-gray-600">
            Submitted {new Date(Number(submission.submitTime) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${getStatusColor(submission.status)}
        `}>
          {getStatusText(submission.status)}
        </span>
        <button className="text-gray-400 hover:text-gray-600">
          <EyeIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============ NFT Badges Tab ============
function NFTBadgesTab() {
  // This would integrate with NFTGallery component
  return (
    <div className="text-center py-8">
      <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">NFT Badges</h3>
      <p className="text-gray-600 mb-4">
        Your earned quest badges will appear here
      </p>
      {/* NFTGallery component would go here */}
    </div>
  );
}