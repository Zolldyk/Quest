'use client';

// ============ Imports ============
import { useState, useEffect } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import { 
  CurrencyDollarIcon,
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  EyeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useContracts, formatTokenAmount, Quest, QuestSubmission } from '../../hooks/useContracts';
import { WalletProtected } from '../wallet/WalletConnection';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';
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
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);

  // ============ Tab Configuration ============
  const tabs: TabProps[] = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'staking', name: 'Staking', icon: CurrencyDollarIcon },
    { id: 'quests', name: 'Quest History', icon: TrophyIcon, count: stats?.questsCompleted },
    { id: 'nfts', name: 'NFT Badges', icon: StarIcon, count: stats?.nftBadges },
  ];

  // ============ Effects ============

  // Fetch user dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!address) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Get staking info
        const stakerInfo = await stakingPool.getStakerInfo(address);
        
        // Get user submissions
        const submissionIds = await questManager.getPlayerSubmissions(address);
        const submissions = await Promise.all(
          (submissionIds || []).map(async (id: any) => {
            return await questManager.getSubmission(Number(id));
          })
        );
        
        const validSubmissions = submissions.filter(s => s !== null) as QuestSubmission[];
        setRecentSubmissions(validSubmissions.slice(-5)); // Last 5 submissions

        // Get completed quests count
        const completedCount = validSubmissions.filter(s => s.status === 1).length; // COMPLETED = 1

        // Get NFT badges
        const userBadges = await nftMinter.getUserBadges(address);
        const badgeCount = userBadges?.length || 0;

        // Calculate total earned (rough estimate from completed submissions)
        const totalEarnedAmount = validSubmissions
          .filter(s => s.status === 1)
          .length * 1; // 1 USDC per quest (simplified)

        // Get pending submissions count
        const pendingCount = validSubmissions.filter(s => s.status === 0).length; // PENDING = 0

        const dashboardStats: DashboardStats = {
          totalStaked: formatTokenAmount(stakerInfo?.stakedAmount, 6),
          totalEarned: totalEarnedAmount.toString(),
          questsCompleted: completedCount,
          nftBadges: badgeCount,
          pendingSubmissions: pendingCount,
        };

        setStats(dashboardStats);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [address, stakingPool, questManager, nftMinter]);

  // ============ JSX Return ============
  return (
    <WalletProtected>
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Track your staking, quest completions, and rewards
          </p>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Staked"
                value={`${stats?.totalStaked || '0'} USDC`}
                icon={<CurrencyDollarIcon className="h-6 w-6 text-blue-600" />}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              <StatCard
                title="Total Earned"
                value={`${stats?.totalEarned || '0'} USDC`}
                icon={<TrophyIcon className="h-6 w-6 text-green-600" />}
                bgColor="bg-green-50"
                textColor="text-green-600"
              />
              <StatCard
                title="Quests Completed"
                value={stats?.questsCompleted?.toString() || '0'}
                icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
                bgColor="bg-purple-50"
                textColor="text-purple-600"
              />
              <StatCard
                title="NFT Badges"
                value={stats?.nftBadges?.toString() || '0'}
                icon={<StarIcon className="h-6 w-6 text-orange-600" />}
                bgColor="bg-orange-50"
                textColor="text-orange-600"
              />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.name}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`
                          ml-2 py-0.5 px-2 rounded-full text-xs font-medium
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
              <div className="p-6">
                {activeTab === 'overview' && (
                  <OverviewTab 
                    stats={stats} 
                    recentSubmissions={recentSubmissions}
                    address={address}
                  />
                )}
                {activeTab === 'staking' && (
                  <StakesSummary />
                )}
                {activeTab === 'quests' && (
                  <SubmissionHistory />
                )}
                {activeTab === 'nfts' && (
                  <NFTBadgesTab address={address} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </WalletProtected>
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
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
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

function OverviewTab({ stats, recentSubmissions, address }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="Stake USDC"
            description="Fund the quest reward pool"
            href="/staking"
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
            color="blue"
          />
          <ActionCard
            title="Browse Quests"
            description="Find new quests to complete"
            href="/quests"
            icon={<TrophyIcon className="h-5 w-5" />}
            color="green"
          />
          <ActionCard
            title="View NFTs"
            description="See your earned badges"
            href="#"
            onClick={() => {}} // Handle NFT gallery
            icon={<StarIcon className="h-5 w-5" />}
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
        block p-4 border-2 rounded-lg transition-colors hover:bg-gray-50
        ${colorClasses[color]}
      `}
    >
      <div className="flex items-center mb-2">
        {icon}
        <h4 className="ml-2 font-medium text-gray-900">{title}</h4>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
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
interface NFTBadgesTabProps {
  address?: string;
}

function NFTBadgesTab({ address }: NFTBadgesTabProps) {
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