'use client';

// ============ Imports ============
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import {
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useQuestManager, Quest, QuestSubmission, formatTokenAmount } from '../../hooks/useContracts';
import LoadingSpinner, { TableRowSkeleton } from '../ui/LoadingSpinner';

// ============ Types ============
interface SubmissionWithQuest extends QuestSubmission {
  questDetails?: Quest;
}

type SubmissionStatus = 'all' | 'pending' | 'completed' | 'rejected';
type SortOption = 'newest' | 'oldest' | 'quest' | 'status';

interface FilterOptions {
  status: SubmissionStatus;
  search: string;
  sort: SortOption;
}

/**
 * @title SubmissionHistory
 * @notice Component displaying user's quest submission history with filtering and sorting
 * @dev Provides comprehensive view of all user quest activities
 */
export default function SubmissionHistory() {

  // ============ Hooks ============
  const address = useAddress();
  const { getPlayerSubmissions, getSubmission, getQuest } = useQuestManager();

  // ============ State ============
  const [submissions, setSubmissions] = useState<SubmissionWithQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithQuest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    search: '',
    sort: 'newest',
  });

  // ============ Effects ============

  // Force refresh trigger to update data when needed
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Function to force refresh submission history data
  const forceRefresh = useCallback(() => {
    console.log('🔄 SubmissionHistory: Force refreshing submission data');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch submission history when address changes
  const fetchSubmissionHistory = useCallback(async () => {
    if (!address) {
      setSubmissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      console.log('📊 SubmissionHistory: Starting data fetch for address:', address);
      
      // Get user's submission IDs with error handling
      let submissionIds: bigint[] = [];
      try {
        const ids = await getPlayerSubmissions(address);
        submissionIds = ids || [];
        console.log('📊 SubmissionHistory: Found submission IDs:', submissionIds.length);
      } catch (error) {
        console.warn('Failed to fetch player submissions:', error);
      }
      
      if (submissionIds.length === 0) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      // Fetch detailed submission data with individual error handling
      const submissionPromises = submissionIds.map(async (id: any) => {
        try {
          const submission = await getSubmission(Number(id));
          if (!submission) return null;

          // Fetch quest details for each submission with error handling
          let questDetails = null;
          try {
            questDetails = await getQuest(Number(submission.questId));
          } catch (error) {
            console.warn(`Failed to fetch quest details for quest ${submission.questId}:`, error);
          }
          
          return {
            ...submission,
            questDetails,
          } as SubmissionWithQuest;
        } catch (error) {
          console.warn(`Failed to fetch submission ${id}:`, error);
          return null;
        }
      });

      const submissionsData = await Promise.all(submissionPromises);
      const validSubmissions = submissionsData.filter(s => s !== null) as SubmissionWithQuest[];
      
      console.log('📊 SubmissionHistory: Processed submissions:', validSubmissions.length);
      setSubmissions(validSubmissions);

    } catch (error) {
      console.error('Error fetching submission history:', error);
      // Set empty array on error to show empty state
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, getPlayerSubmissions, getSubmission, getQuest]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchSubmissionHistory();
  }, [fetchSubmissionHistory, refreshTrigger]);

  // Effect to force refresh when address changes (wallet connects/disconnects)
  useEffect(() => {
    if (address) {
      console.log('🔄 SubmissionHistory: Address changed, forcing refresh');
      // Small delay to ensure contracts are ready
      const timer = setTimeout(() => {
        forceRefresh();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [address, forceRefresh]);

  // ============ Computed Values ============
  
  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Filter by status
    if (filters.status !== 'all') {
      const statusMap = { pending: 0, completed: 1, rejected: 2 };
      filtered = filtered.filter(s => s.status === statusMap[filters.status as keyof typeof statusMap]);
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.questDetails?.title.toLowerCase().includes(searchTerm) ||
        s.questDetails?.description.toLowerCase().includes(searchTerm) ||
        s.tweetUrl.toLowerCase().includes(searchTerm)
      );
    }

    // Sort submissions
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'newest':
          return Number(b.submitTime) - Number(a.submitTime);
        case 'oldest':
          return Number(a.submitTime) - Number(b.submitTime);
        case 'quest':
          return (a.questDetails?.title || '').localeCompare(b.questDetails?.title || '');
        case 'status':
          return a.status - b.status;
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const completed = submissions.filter(s => s.status === 1).length;
    const pending = submissions.filter(s => s.status === 0).length;
    const rejected = submissions.filter(s => s.status === 2).length;
    const totalEarned = completed * 1; // 1 USDC per quest (simplified)

    console.log('📊 SubmissionHistory: Calculated stats', {
      total,
      completed,
      pending,
      rejected,
      totalEarned,
      submissions: submissions.map(s => ({
        questId: s.questId?.toString(),
        status: s.status,
        submitTime: s.submitTime?.toString()
      }))
    });

    return { total, completed, pending, rejected, totalEarned };
  }, [submissions]);

  // ============ Handlers ============
  
  const handleViewDetails = (submission: SubmissionWithQuest) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-yellow-700 bg-yellow-100 border-yellow-200'; // PENDING
      case 1: return 'text-green-700 bg-green-100 border-green-200';   // COMPLETED
      case 2: return 'text-red-700 bg-red-100 border-red-200';         // REJECTED
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
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

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: return <ClockIcon className="h-4 w-4" />;
      case 1: return <CheckCircleIcon className="h-4 w-4" />;
      case 2: return <XCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  // ============ Loading State ============
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4">
            <table className="w-full">
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============ JSX Return ============
  return (
    <div className="space-y-6">
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={stats.total}
          icon={<TrophyIcon className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircleIcon className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<ClockIcon className="h-5 w-5 text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title="Total Earned"
          value={`${stats.totalEarned} USDC`}
          icon={<StarIcon className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search submissions..."
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Sort Options */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="quest">By Quest</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <EmptyState filters={filters} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Quest Submissions ({filteredSubmissions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission, index) => (
                  <SubmissionRow
                    key={index}
                    submission={submission}
                    onViewDetails={() => handleViewDetails(submission)}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedSubmission && (
        <SubmissionDetailsModal
          submission={selectedSubmission}
          onClose={() => setShowDetails(false)}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  );
}

// ============ Stat Card Component ============
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============ Submission Row Component ============
interface SubmissionRowProps {
  submission: SubmissionWithQuest;
  onViewDetails: () => void;
  getStatusColor: (status: number) => string;
  getStatusText: (status: number) => string;
  getStatusIcon: (status: number) => React.ReactNode;
}

function SubmissionRow({ 
  submission, 
  onViewDetails, 
  getStatusColor, 
  getStatusText, 
  getStatusIcon 
}: SubmissionRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <TrophyIcon className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {submission.questDetails?.title || `Quest #${submission.questId.toString()}`}
            </div>
            <div className="text-sm text-gray-500">
              ID: {submission.questId.toString()}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
          ${getStatusColor(submission.status)}
        `}>
          {getStatusIcon(submission.status)}
          <span className="ml-1">{getStatusText(submission.status)}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          {new Date(Number(submission.submitTime) * 1000).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {submission.status === 1 ? (
          <span className="font-medium text-green-600">
            {formatTokenAmount(submission.questDetails?.rewardAmount, 6)} USDC
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-900 flex items-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <a
            href={submission.tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </div>
      </td>
    </tr>
  );
}

// ============ Empty State Component ============
interface EmptyStateProps {
  filters: FilterOptions;
}

function EmptyState({ filters }: EmptyStateProps) {
  const hasFilters = filters.status !== 'all' || filters.search !== '';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <TrophyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No submissions found' : 'No quest submissions yet'}
      </h3>
      <p className="text-gray-600 mb-6">
        {hasFilters 
          ? 'Try adjusting your filters to see more results.'
          : 'Complete your first quest to start earning rewards and NFT badges!'
        }
      </p>
      {!hasFilters && (
        <a
          href="/quests"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrophyIcon className="h-4 w-4 mr-2" />
          Browse Available Quests
        </a>
      )}
    </div>
  );
}

// ============ Submission Details Modal ============
interface SubmissionDetailsModalProps {
  submission: SubmissionWithQuest;
  onClose: () => void;
  getStatusColor: (status: number) => string;
  getStatusText: (status: number) => string;
  getStatusIcon: (status: number) => React.ReactNode;
}

function SubmissionDetailsModal({
  submission,
  onClose,
  getStatusColor,
  getStatusText,
  getStatusIcon
}: SubmissionDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Submission Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Quest #{submission.questId.toString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Quest Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quest Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Title:</label>
                <p className="text-gray-900">
                  {submission.questDetails?.title || `Quest #${submission.questId.toString()}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description:</label>
                <p className="text-gray-900">
                  {submission.questDetails?.description || 'No description available'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Requirements:</label>
                <p className="text-gray-900 font-mono text-sm bg-white rounded p-2 border">
                  {submission.questDetails?.requirements || 'No requirements available'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reward:</label>
                <p className="text-green-600 font-semibold">
                  {formatTokenAmount(submission.questDetails?.rewardAmount, 6)} USDC + NFT Badge
                </p>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <div className="mt-1">
                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                    ${getStatusColor(submission.status)}
                  `}>
                    {getStatusIcon(submission.status)}
                    <span className="ml-2">{getStatusText(submission.status)}</span>
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Proof URL:</label>
                <div className="mt-1 flex items-center space-x-2">
                  <p className="text-gray-900 font-mono text-sm bg-white rounded p-2 border flex-1">
                    {submission.tweetUrl}
                  </p>
                  <a
                    href={submission.tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    title="Open link"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted:</label>
                  <p className="text-gray-900">
                    {new Date(Number(submission.submitTime) * 1000).toLocaleString()}
                  </p>
                </div>
                
                {submission.status !== 0 && submission.verifyTime > BigInt(0) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {submission.status === 1 ? 'Approved:' : 'Rejected:'}
                    </label>
                    <p className="text-gray-900">
                      {new Date(Number(submission.verifyTime) * 1000).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {submission.verifiedBy && submission.verifiedBy !== '0x0000000000000000000000000000000000000000' && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Verified by:</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {submission.verifiedBy.slice(0, 10)}...{submission.verifiedBy.slice(-8)}
                  </p>
                </div>
              )}

              {submission.status === 2 && submission.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Rejection Reason:</label>
                  <p className="text-red-700 bg-red-50 rounded p-2 border border-red-200">
                    {submission.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NFT Information */}
          {submission.status === 1 && submission.nftTokenId > BigInt(0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">NFT Badge</h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="font-semibold text-purple-900">NFT Badge Minted!</p>
                    <p className="text-sm text-purple-700">
                      Token ID: #{submission.nftTokenId.toString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-3">
              <TimelineItem
                icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                title="Quest Submitted"
                time={new Date(Number(submission.submitTime) * 1000)}
                description="Submission received and awaiting review"
                completed={true}
              />
              
              {submission.status !== 0 && (
                <TimelineItem
                  icon={submission.status === 1 ? 
                    <CheckCircleIcon className="h-4 w-4" /> : 
                    <XCircleIcon className="h-4 w-4" />
                  }
                  title={submission.status === 1 ? "Quest Approved" : "Quest Rejected"}
                  time={new Date(Number(submission.verifyTime) * 1000)}
                  description={
                    submission.status === 1 
                      ? "Reward distributed and NFT badge minted"
                      : `Rejected: ${submission.rejectionReason || 'See rejection reason above'}`
                  }
                  completed={true}
                  isSuccess={submission.status === 1}
                  isError={submission.status === 2}
                />
              )}
              
              {submission.status === 0 && (
                <TimelineItem
                  icon={<ClockIcon className="h-4 w-4" />}
                  title="Under Review"
                  description="Your submission is being reviewed by our team"
                  completed={false}
                  isPending={true}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Timeline Item Component ============
interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  time?: Date;
  description: string;
  completed: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  isPending?: boolean;
}

function TimelineItem({ 
  icon, 
  title, 
  time, 
  description, 
  completed, 
  isSuccess, 
  isError, 
  isPending 
}: TimelineItemProps) {
  const getColors = () => {
    if (isSuccess) return 'bg-green-100 text-green-600 border-green-200';
    if (isError) return 'bg-red-100 text-red-600 border-red-200';
    if (isPending) return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    if (completed) return 'bg-blue-100 text-blue-600 border-blue-200';
    return 'bg-gray-100 text-gray-400 border-gray-200';
  };

  return (
    <div className="flex items-start space-x-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getColors()}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {time && (
            <p className="text-xs text-gray-500">
              {time.toLocaleString()}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}