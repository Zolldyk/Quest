'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
import { useAddress } from '../../hooks/useThirdwebV5';
import {
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon as GridIcon,
  ListBulletIcon as ListIcon,
  ShareIcon,
  ArrowDownTrayIcon as DownloadIcon,
} from '@heroicons/react/24/outline';
import { useNFTMinter, QuestBadge } from '../../hooks/useContracts';
import { WalletProtected } from '../wallet/WalletConnection';
import { CardSkeleton } from '../ui/LoadingSpinner';
// Import will be added after we resolve the path issue
// import BadgeCard from './BadgeCard';
import { toast } from 'react-hot-toast';

// ============ Types ============
export interface BadgeWithMetadata extends QuestBadge {
  tokenId: number;
  tokenURI?: string;
  questTitle: string;
  questReward: any;
  isValid: boolean;
}

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'recent' | 'oldest';
type SortOption = 'newest' | 'oldest' | 'quest';

/**
 * @title NFTGallery
 * @notice Component for displaying user's quest badge NFT collection
 * @dev Shows earned badges with filtering, sorting, and detailed views
 */
export default function NFTGallery() {

  // ============ Hooks ============
  const address = useAddress();
  const { 
    getUserBadges,
    getBadge,
    getUserBadgeCount,
    getTokenURI,
    totalSupply 
  } = useNFTMinter();

  // ============ State ============
  const [badges, setBadges] = useState<BadgeWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithMetadata | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBadgeCount, setUserBadgeCount] = useState(0);

  // ============ Effects ============

  // Fetch user's NFT badges
  useEffect(() => {
    const fetchUserBadges = async () => {
      if (!address) {
        setBadges([]);
        setUserBadgeCount(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Initialize default values
        let userBadgeIds: bigint[] = [];
        let badgeCount = 0;

        // Get user's badge token IDs with error handling
        try {
          const ids = await getUserBadges(address);
          userBadgeIds = ids || [];
        } catch (error) {
          console.warn('Failed to fetch user badges:', error);
        }

        // Get badge count with error handling
        try {
          badgeCount = await getUserBadgeCount(address);
        } catch (error) {
          console.warn('Failed to fetch badge count:', error);
        }
        
        setUserBadgeCount(badgeCount);

        if (userBadgeIds.length === 0) {
          setBadges([]);
          setIsLoading(false);
          return;
        }

        // Fetch detailed badge information with individual error handling
        const badgePromises = userBadgeIds.map(async (tokenId: any) => {
          try {
            const badge = await getBadge(Number(tokenId));
            if (!badge) return null;

            // Get token URI for metadata with error handling
            let tokenURI = "";
            try {
              const uri = await getTokenURI(Number(tokenId));
              tokenURI = uri || "";
            } catch (error) {
              console.warn(`Failed to fetch token URI for ${tokenId}:`, error);
            }

            return {
              ...badge,
              tokenId: Number(tokenId),
              tokenURI,
            } as BadgeWithMetadata;
          } catch (error) {
            console.warn(`Failed to fetch badge data for ${tokenId}:`, error);
            return null;
          }
        });

        const badgeData = await Promise.all(badgePromises);
        const validBadges = badgeData.filter((b: BadgeWithMetadata | null): b is BadgeWithMetadata => b !== null);
        
        setBadges(validBadges);

      } catch (error) {
        console.error('Error fetching user badges:', error);
        // Don't show toast error, let component handle empty state gracefully
        setBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBadges();
  }, [address, getUserBadges, getBadge, getUserBadgeCount, getTokenURI]);

  // ============ Computed Values ============
  
  // Filter and sort badges
  const filteredBadges = useMemo(() => {
    let filtered = [...badges];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(badge => 
        badge.questTitle.toLowerCase().includes(term) ||
        badge.questId.toString().includes(term)
      );
    }

    // Apply filters
    if (filter === 'recent') {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(badge => 
        Number(badge.mintTime) * 1000 > oneWeekAgo
      );
    }

    // Sort badges
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.mintTime) - Number(a.mintTime);
        case 'oldest':
          return Number(a.mintTime) - Number(b.mintTime);
        case 'quest':
          return a.questTitle.localeCompare(b.questTitle);
        default:
          return 0;
      }
    });

    return filtered;
  }, [badges, searchTerm, filter, sortBy]);

  // ============ Handlers ============
  
  const handleViewBadge = (badge: BadgeWithMetadata) => {
    setSelectedBadge(badge);
    setShowDetailModal(true);
  };

  const handleShareBadge = (badge: BadgeWithMetadata) => {
    const shareUrl = `${window.location.origin}/badge/${badge.tokenId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Badge link copied to clipboard!');
  };

  const handleDownloadBadge = async () => {
    try {
      // This would need to be implemented based on your metadata structure
      toast('Download feature coming soon!', { icon: 'ℹ️' });
    } catch (error) {
      toast.error('Failed to download badge');
    }
  };

  // ============ Loading State ============
  if (isLoading) {
    return (
      <WalletProtected>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </WalletProtected>
    );
  }

  // ============ JSX Return ============
  return (
    <WalletProtected>
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My NFT Badges</h1>
              <p className="text-gray-600">
                Your collection of quest completion badges ({userBadgeCount} badges)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <GridIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Badges Earned"
            value={userBadgeCount}
            icon={<StarIcon className="h-6 w-6 text-yellow-600" />}
            color="yellow"
          />
          <StatCard
            title="Quests Completed" 
            value={badges.length}
            icon={<StarIcon className="h-6 w-6 text-green-600" />}
            color="green"
          />
          <StatCard
            title="Collection Rarity"
            value={totalSupply ? `${((userBadgeCount / Number(totalSupply)) * 100).toFixed(1)}%` : '0%'}
            icon={<StarIcon className="h-6 w-6 text-purple-600" />}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
                  placeholder="Search badges..."
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterOption)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Badges</option>
                  <option value="recent">Recent (7 days)</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

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

        {/* Badge Collection */}
        {filteredBadges.length === 0 ? (
          <EmptyState 
            hasFilters={searchTerm !== '' || filter !== 'all'}
            onClearFilters={() => {
              setSearchTerm('');
              setFilter('all');
            }}
          />
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }
          `}>
            {filteredBadges.map((badge) => (
              <BadgeCardComponent
                key={badge.tokenId}
                badge={badge}
                viewMode={viewMode}
                onView={() => handleViewBadge(badge)}
                onShare={() => handleShareBadge(badge)}
                onDownload={() => handleDownloadBadge()}
              />
            ))}
          </div>
        )}

        {/* Badge Detail Modal */}
        {showDetailModal && selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedBadge(null);
            }}
            onShare={() => handleShareBadge(selectedBadge)}
            onDownload={() => handleDownloadBadge()}
          />
        )}
      </div>
    </WalletProtected>
  );
}

// ============ Stat Card Component ============
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'yellow' | 'green' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
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

// ============ Empty State Component ============
interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {hasFilters ? (
        <>
          <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No badges found
          </h3>
          <p className="text-gray-600 mb-6">
            No badges match your current search or filter criteria.
          </p>
          <button
            onClick={onClearFilters}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </>
      ) : (
        <>
          <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No badges yet
          </h3>
          <p className="text-gray-600 mb-6">
            Complete quests to earn your first NFT badge!
          </p>
          <a
            href="/quests"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <StarIcon className="h-4 w-4 mr-2" />
            Browse Available Quests
          </a>
        </>
      )}
    </div>
  );
}

// ============ Badge Detail Modal Component ============
interface BadgeDetailModalProps {
  badge: BadgeWithMetadata;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
}

function BadgeDetailModal({ badge, onClose, onShare, onDownload }: BadgeDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Badge Details
          </h2>
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
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <StarIcon className="h-16 w-16 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {badge.questTitle}
            </h3>
            <p className="text-gray-600">
              Token ID: #{badge.tokenId}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Badge Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quest ID:</span>
                  <span className="font-medium">#{badge.questId.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Earned:</span>
                  <span className="font-medium">
                    {new Date(Number(badge.mintTime) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reward:</span>
                  <span className="font-medium text-green-600">
                    {(Number(badge.questReward) / 1e6).toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${badge.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {badge.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Proof of Completion</h4>
              <div className="text-sm">
                <p className="text-gray-600 mb-2">Original submission:</p>
                <a
                  href={badge.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {badge.tweetUrl}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onShare}
              className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              onClick={onDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Temporary Badge Card Component ============
interface BadgeCardProps {
  badge: BadgeWithMetadata;
  viewMode: 'grid' | 'list';
  onView: () => void;
  onShare: () => void;
  onDownload: () => void;
}

function BadgeCardComponent({ 
  badge, 
  viewMode, 
  onView, 
  onShare, 
  onDownload 
}: BadgeCardProps) {

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const earned = timestamp * 1000;
    const diffMinutes = Math.floor((now - earned) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
    return formatDate(timestamp);
  };

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 group">
        
        {/* Badge Image/Icon */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 h-48 flex items-center justify-center">
          <StarIcon className="h-20 w-20 text-white drop-shadow-lg" />
          
          {/* Badge Number */}
          <div className="absolute top-3 right-3 bg-black bg-opacity-30 text-white text-xs font-bold px-2 py-1 rounded-full">
            #{badge.tokenId}
          </div>

          {/* Validation Status */}
          {badge.isValid && (
            <div className="absolute top-3 left-3 bg-green-500 bg-opacity-90 text-white p-1 rounded-full">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
              {badge.questTitle}
            </h3>
            <p className="text-xs text-gray-500">
              Quest #{badge.questId.toString()}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{getTimeAgo(Number(badge.mintTime))}</span>
            </div>
            <div className="flex items-center text-green-600 font-medium">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
              </svg>
              <span>{(Number(badge.questReward) / 1e6).toFixed(1)} USDC</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onView}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            View Badge
          </button>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-200">
      <div className="flex items-center space-x-4">
        
        {/* Badge Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-lg flex items-center justify-center relative">
            <StarIcon className="h-8 w-8 text-white" />
            {badge.isValid && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Badge Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {badge.questTitle}
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              #{badge.tokenId}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
            <div className="flex items-center">
              <span className="font-medium">Quest #{badge.questId.toString()}</span>
            </div>
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(Number(badge.mintTime))}</span>
            </div>
            <div className="flex items-center text-green-600 font-medium">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 714.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 713.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 710 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 710-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
              </svg>
              <span>{(Number(badge.questReward) / 1e6).toFixed(2)} USDC</span>
            </div>
          </div>

          {/* Proof Link */}
          <div className="text-xs text-gray-500 truncate mb-2">
            <span className="font-medium">Proof: </span>
            <a 
              href={badge.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {badge.tweetUrl.length > 40 
                ? `${badge.tweetUrl.substring(0, 40)}...` 
                : badge.tweetUrl
              }
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onView}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="View details"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={onShare}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Share badge"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDownload}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            title="Download badge"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}