'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { useQuestManager, Quest, QuestSubmission, formatTokenAmount } from '../../hooks/useContracts';
import LoadingSpinner, { TableRowSkeleton } from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

// ============ Types ============
interface SubmissionWithDetails extends QuestSubmission {
  questDetails?: Quest;
}

interface VerificationModalProps {
  submission: SubmissionWithDetails;
  onClose: () => void;
  onVerify: (approved: boolean, reason?: string) => void;
  isVerifying: boolean;
}

type SortOption = 'newest' | 'oldest' | 'quest';

/**
 * @title PendingSubmissions
 * @notice Admin component for reviewing and verifying pending quest submissions
 * @dev Provides comprehensive submission review tools with batch operations
 */
export default function PendingSubmissions() {

  // ============ Hooks ============
  const { 
    pendingSubmissions,
    getSubmission,
    getQuest,
    verifyQuestSubmission,
    isVerifying,
    refetchPendingSubmissions 
  } = useQuestManager();

  // ============ State ============
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());

  // ============ Effects ============

  // Fetch pending submission details
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!(pendingSubmissions as unknown as any[])?.length) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const submissionPromises = (pendingSubmissions as unknown as any[]).map(async (id: any) => {
          const submission = await getSubmission(Number(id));
          if (!submission) return null;

          // Fetch quest details for each submission
          const questDetails = await getQuest(Number(submission.questId));
          
          return {
            ...submission,
            questDetails,
          } as SubmissionWithDetails;
        });

        const submissionsData = await Promise.all(submissionPromises);
        const validSubmissions = submissionsData.filter(s => s !== null) as SubmissionWithDetails[];
        
        setSubmissions(validSubmissions);

      } catch (error) {
        console.error('Error fetching submission details:', error);
        toast.error('Failed to load pending submissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [pendingSubmissions, getSubmission, getQuest]);

  // ============ Computed Values ============
  
  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.questDetails?.title.toLowerCase().includes(term) ||
        s.player.toLowerCase().includes(term) ||
        s.tweetUrl.toLowerCase().includes(term)
      );
    }

    // Sort submissions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.submitTime) - Number(a.submitTime);
        case 'oldest':
          return Number(a.submitTime) - Number(b.submitTime);
        case 'quest':
          return (a.questDetails?.title || '').localeCompare(b.questDetails?.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, searchTerm, sortBy]);

  // ============ Handlers ============
  
  const handleVerify = async (submissionId: number, approved: boolean, reason?: string) => {
    try {
      await verifyQuestSubmission(submissionId, approved, reason || '');
      
      // Refresh pending submissions
      await refetchPendingSubmissions();
      
      // Close modal
      setShowVerificationModal(false);
      setSelectedSubmission(null);
      
      toast.success(`Submission ${approved ? 'approved' : 'rejected'} successfully!`);
      
    } catch (error) {
      console.error('Verification failed:', error);
      // Error is handled in the hook
    }
  };

  const handleQuickApprove = async (submission: SubmissionWithDetails) => {
    await handleVerify(parseInt(submission.questId.toString()), true);
  };

  const handleQuickReject = async (submission: SubmissionWithDetails) => {
    await handleVerify(parseInt(submission.questId.toString()), false, 'Does not meet requirements');
  };

  const handleViewDetails = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setShowVerificationModal(true);
  };

  const handleSelectSubmission = (submissionId: number) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      const allIds = filteredSubmissions.map((_, index) => index);
      setSelectedSubmissions(new Set(allIds));
    }
  };

  // ============ Loading State ============
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4">
            <table className="w-full">
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============ Empty State ============
  if (filteredSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        {searchTerm ? (
          <>
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No submissions found
            </h3>
            <p className="text-gray-600 mb-4">
              No pending submissions match your search criteria.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </button>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600">
              No pending submissions to review at the moment.
            </p>
          </>
        )}
      </div>
    );
  }

  // ============ JSX Return ============
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Pending Submissions ({filteredSubmissions.length})
          </h2>
          <p className="text-gray-600 text-sm">
            Review and verify quest submissions for reward distribution
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedSubmissions.size > 0 && (
            <span className="text-sm text-gray-600">
              {selectedSubmissions.size} selected
            </span>
          )}
          <button
            onClick={() => refetchPendingSubmissions()}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search by quest, user, or URL..."
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="quest">By Quest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quest & User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proof
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
                  isSelected={selectedSubmissions.has(index)}
                  onSelect={() => handleSelectSubmission(index)}
                  onView={() => handleViewDetails(submission)}
                  onQuickApprove={() => handleQuickApprove(submission)}
                  onQuickReject={() => handleQuickReject(submission)}
                  isVerifying={isVerifying}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedSubmission && (
        <VerificationModal
          submission={selectedSubmission}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedSubmission(null);
          }}
          onVerify={(approved, reason) => 
            handleVerify(parseInt(selectedSubmission.questId.toString()), approved, reason)
          }
          isVerifying={isVerifying}
        />
      )}
    </div>
  );
}

// ============ Submission Row Component ============
interface SubmissionRowProps {
  submission: SubmissionWithDetails;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onQuickApprove: () => void;
  onQuickReject: () => void;
  isVerifying: boolean;
}

function SubmissionRow({
  submission,
  isSelected,
  onSelect,
  onView,
  onQuickApprove,
  onQuickReject,
  isVerifying
}: SubmissionRowProps) {
  
  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const submitted = timestamp * 1000;
    const diffMinutes = Math.floor((now - submitted) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {submission.questDetails?.title || `Quest #${submission.questId.toString()}`}
            </div>
            <div className="text-sm text-gray-500 font-mono">
              {submission.player.slice(0, 10)}...{submission.player.slice(-6)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Quest ID: {submission.questId.toString()}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-900 truncate max-w-xs">
              {submission.tweetUrl}
            </div>
            <a
              href={submission.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
            >
              <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
              Open link
            </a>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-500">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          <div>
            <div>{new Date(Number(submission.submitTime) * 1000).toLocaleDateString()}</div>
            <div className="text-xs text-gray-400">
              {timeAgo(Number(submission.submitTime))}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-green-600">
          {formatTokenAmount(submission.questDetails?.rewardAmount, 6)} USDC
        </div>
        <div className="text-xs text-gray-500">+ NFT Badge</div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={onView}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onQuickApprove}
            disabled={isVerifying}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
            title="Quick approve"
          >
            <CheckCircleIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onQuickReject}
            disabled={isVerifying}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            title="Quick reject"
          >
            <XCircleIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============ Verification Modal Component ============
function VerificationModal({
  submission,
  onClose,
  onVerify,
  isVerifying
}: VerificationModalProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = () => {
    if (decision === 'approve') {
      onVerify(true);
    } else if (decision === 'reject') {
      onVerify(false, rejectionReason);
    }
  };

  const commonRejectionReasons = [
    'Tweet does not contain required hashtag',
    'Account does not tag required handles',
    'Content does not meet quality standards',
    'Submission appears to be spam',
    'Tweet URL is invalid or inaccessible',
    'Does not meet quest requirements',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Verify Quest Submission
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Quest #{submission.questId.toString()} • {submission.questDetails?.title}
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
          
          {/* Submission Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Quest Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quest Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title:</label>
                    <p className="text-gray-900">{submission.questDetails?.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Requirements:</label>
                    <p className="text-gray-900 text-sm bg-white rounded p-2 border font-mono">
                      {submission.questDetails?.requirements}
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

              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Wallet Address:</label>
                    <p className="text-gray-900 font-mono text-sm">{submission.player}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted:</label>
                    <p className="text-gray-900">
                      {new Date(Number(submission.submitTime) * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Proof Review */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Proof</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-600">Tweet URL:</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <p className="text-gray-900 font-mono text-sm bg-white rounded p-2 border flex-1 break-all">
                        {submission.tweetUrl}
                      </p>
                      <a
                        href={submission.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        title="Open in new tab"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Verification Checklist:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Tweet contains required hashtag #EtherlinkQuest</li>
                          <li>• Tweet mentions/tags the required accounts</li>
                          <li>• Content is appropriate and relevant</li>
                          <li>• Tweet is public and accessible</li>
                          <li>• Account appears to be genuine (not spam)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Decision</h3>
            
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setDecision('approve')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  decision === 'approve'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-200'
                }`}
              >
                <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                Approve Submission
              </button>
              <button
                onClick={() => setDecision('reject')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  decision === 'reject'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:border-red-200'
                }`}
              >
                <XCircleIcon className="h-5 w-5 inline mr-2" />
                Reject Submission
              </button>
            </div>

            {/* Rejection Reason */}
            {decision === 'reject' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Explain why this submission is being rejected..."
                  />
                </div>

                {/* Quick Reason Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Common Reasons:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonRejectionReasons.map((reason, index) => (
                      <button
                        key={index}
                        onClick={() => setRejectionReason(reason)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision || (decision === 'reject' && !rejectionReason.trim()) || isVerifying}
            className={`px-6 py-2 font-medium rounded-lg transition-colors flex items-center ${
              decision === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300'
                : decision === 'reject'
                  ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                {decision === 'approve' ? 'Approve & Reward' : decision === 'reject' ? 'Reject Submission' : 'Select Decision'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}