'use client';

// ============ Imports ============
import { useState, useEffect } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import {
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useQuestManager, useStakingPool, formatTokenAmount } from '../../hooks/useContracts';
import { WalletProtected } from '../wallet/WalletConnection';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';
import PendingSubmissions from './PendingSubmissions';
import QuestManagement from './QuestManagement';
import { toast } from 'react-hot-toast';

// ============ Types ============
interface AdminStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  completedSubmissions: number;
  rejectedSubmissions: number;
  totalRewardsDistributed: string;
  poolBalance: string;
  totalStakers: number;
  activeQuests: number;
}

interface TabProps {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  color?: string;
}

/**
 * @title AdminPanel
 * @notice Main admin dashboard for Quest dApp management
 * @dev Provides comprehensive admin tools for quest verification and system management
 */
export default function AdminPanel() {

  // ============ Hooks ============
  const address = useAddress();
  const { 
    pendingSubmissions,
    checkIsAdmin,
    getSubmission,
    activeQuests,
    refetchPendingSubmissions 
  } = useQuestManager();
  
  const { 
    poolBalance,
    poolStats 
  } = useStakingPool();

  // ============ State ============
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // ============ Tab Configuration ============
  const tabs: TabProps[] = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: CogIcon,
      color: 'text-blue-600'
    },
    { 
      id: 'pending', 
      name: 'Pending Submissions', 
      icon: ClockIcon,
      count: stats?.pendingSubmissions,
      color: 'text-yellow-600'
    },
    { 
      id: 'quests', 
      name: 'Quest Management', 
      icon: TrophyIcon,
      count: stats?.activeQuests,
      color: 'text-green-600'
    },
  ];

  // ============ Effects ============

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!address) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      setIsCheckingAdmin(true);

      try {
        const adminStatus = await checkIsAdmin(address);
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          toast.error('Access denied: Admin privileges required');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        toast.error('Failed to verify admin status');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [address, checkIsAdmin]);

  // Fetch admin statistics
  useEffect(() => {
    const fetchAdminStats = async () => {
      if (!isAdmin) {
        setStats(null);
        setIsLoadingStats(false);
        return;
      }

      setIsLoadingStats(true);

      try {
        // Get pending submissions details
        const pendingIds = (pendingSubmissions as unknown as any[]) || [];
        let completedCount = 0;
        let rejectedCount = 0;

        // For demo purposes, we'll estimate based on pool stats
        // In production, use subgraph or event logs
        const totalRewards = poolStats?.[2] || 0;
        completedCount = Math.floor(parseInt(formatTokenAmount(BigInt(totalRewards), 6)) || 0);

        const adminStats: AdminStats = {
          totalSubmissions: pendingIds.length + completedCount + rejectedCount,
          pendingSubmissions: pendingIds.length,
          completedSubmissions: completedCount,
          rejectedSubmissions: rejectedCount,
          totalRewardsDistributed: formatTokenAmount(BigInt(totalRewards), 6),
          poolBalance: formatTokenAmount(poolBalance, 6),
          totalStakers: Number(poolStats?.[1] || 0),
          activeQuests: (activeQuests as unknown as any[])?.length || 0,
        };

        setStats(adminStats);

      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast.error('Failed to load admin statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchAdminStats();
  }, [isAdmin, pendingSubmissions, poolBalance, poolStats, activeQuests]);

  // ============ Loading States ============
  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // ============ Access Denied ============
  if (!isAdmin) {
    return (
      <WalletProtected>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You dont have administrator privileges to access this panel.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <strong>Admin Required:</strong> Only authorized administrators can access 
                quest verification and system management tools.
              </p>
            </div>
          </div>
        </div>
      </WalletProtected>
    );
  }

  // ============ JSX Return ============
  return (
    <WalletProtected>
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">
            Manage quest submissions, verify completions, and oversee system operations
          </p>
        </div>

        {isLoadingStats ? (
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
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AdminStatCard
                title="Pending Reviews"
                value={stats?.pendingSubmissions?.toString() || '0'}
                icon={<ClockIcon className="h-6 w-6 text-yellow-600" />}
                bgColor="bg-yellow-50"
                textColor="text-yellow-600"
                borderColor="border-yellow-200"
                urgent={stats ? stats.pendingSubmissions > 0 : false}
              />
              <AdminStatCard
                title="Pool Balance"
                value={`${stats?.poolBalance || '0'} USDC`}
                icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                bgColor="bg-green-50"
                textColor="text-green-600"
                borderColor="border-green-200"
              />
              <AdminStatCard
                title="Total Stakers"
                value={stats?.totalStakers?.toString() || '0'}
                icon={<UsersIcon className="h-6 w-6 text-blue-600" />}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
                borderColor="border-blue-200"
              />
              <AdminStatCard
                title="Active Quests"
                value={stats?.activeQuests?.toString() || '0'}
                icon={<TrophyIcon className="h-6 w-6 text-purple-600" />}
                bgColor="bg-purple-50"
                textColor="text-purple-600"
                borderColor="border-purple-200"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Review Submissions"
                  description={`${stats?.pendingSubmissions || 0} submissions waiting`}
                  onClick={() => setActiveTab('pending')}
                  icon={<ClockIcon className="h-5 w-5" />}
                  color="yellow"
                  urgent={stats ? stats.pendingSubmissions > 0 : false}
                />
                <QuickActionCard
                  title="Manage Quests"
                  description="Create and edit quest campaigns"
                  onClick={() => setActiveTab('quests')}
                  icon={<TrophyIcon className="h-5 w-5" />}
                  color="green"
                />
                <QuickActionCard
                  title="System Overview"
                  description="View detailed system statistics"
                  onClick={() => setActiveTab('overview')}
                  icon={<EyeIcon className="h-5 w-5" />}
                  color="blue"
                />
              </div>
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
                      <tab.icon className={`h-4 w-4 mr-2 ${tab.color || 'text-current'}`} />
                      {tab.name}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`
                          ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                          ${activeTab === tab.id 
                            ? 'bg-blue-100 text-blue-600' 
                            : tab.id === 'pending' && tab.count > 0
                              ? 'bg-red-100 text-red-600 animate-pulse'
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
                  <OverviewTab stats={stats} />
                )}
                {activeTab === 'pending' && (
                  <PendingSubmissions />
                )}
                {activeTab === 'quests' && (
                  <QuestManagement />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </WalletProtected>
  );
}

// ============ Admin Stat Card Component ============
interface AdminStatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  urgent?: boolean;
}

function AdminStatCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  textColor, 
  borderColor,
  urgent = false 
}: AdminStatCardProps) {
  return (
    <div className={`
      bg-white rounded-xl shadow-card border-2 p-6 transition-all duration-200
      ${borderColor} ${urgent ? 'ring-2 ring-red-200 animate-pulse' : ''}
    `}>
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          {urgent && (
            <p className="text-xs text-red-600 font-medium mt-1">Requires attention!</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Quick Action Card Component ============
interface QuickActionCardProps {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow';
  urgent?: boolean;
}

function QuickActionCard({ 
  title, 
  description, 
  onClick, 
  icon, 
  color,
  urgent = false 
}: QuickActionCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300 text-blue-600 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-300 text-green-600 hover:bg-green-50',
    yellow: 'border-yellow-200 hover:border-yellow-300 text-yellow-600 hover:bg-yellow-50',
  };

  return (
    <button
      onClick={onClick}
      className={`
        p-4 border-2 rounded-lg transition-all duration-200 text-left
        ${colorClasses[color]} 
        ${urgent ? 'ring-2 ring-red-200 animate-pulse' : ''}
      `}
    >
      <div className="flex items-center mb-2">
        {icon}
        <h4 className="ml-2 font-medium text-gray-900">{title}</h4>
        {urgent && (
          <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}

// ============ Overview Tab Component ============
interface OverviewTabProps {
  stats: AdminStats | null;
}

function OverviewTab({ stats }: OverviewTabProps) {
  if (!stats) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading system overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* System Health */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Submission Status */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Submission Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="font-semibold text-yellow-600">
                  {stats.pendingSubmissions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
                <span className="font-semibold text-green-600">
                  {stats.completedSubmissions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Rejected</span>
                </div>
                <span className="font-semibold text-red-600">
                  {stats.rejectedSubmissions}
                </span>
              </div>
            </div>
          </div>

          {/* Pool Status */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Pool Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Available Balance</span>
                <span className="font-semibold text-green-600">
                  {stats.poolBalance} USDC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Total Stakers</span>
                <span className="font-semibold text-blue-600">
                  {stats.totalStakers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Rewards Paid</span>
                <span className="font-semibold text-purple-600">
                  {stats.totalRewardsDistributed} USDC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-medium text-gray-900">System Metrics</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalSubmissions}
                </div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedSubmissions}
                </div>
                <div className="text-sm text-gray-600">Successful Quests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.activeQuests}
                </div>
                <div className="text-sm text-gray-600">Active Quests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {((stats.completedSubmissions / Math.max(stats.totalSubmissions, 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Administrator Privileges</h4>
              <p className="text-blue-800 text-sm mb-4">
                As an admin, you can verify quest submissions, manage active quests, 
                and monitor system health. Always verify submissions carefully to maintain 
                community trust.
              </p>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Review and verify pending quest submissions</p>
                <p>• Create and manage quest campaigns</p>
                <p>• Monitor pool balance and staking activity</p>
                <p>• Ensure fair and timely reward distribution</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}