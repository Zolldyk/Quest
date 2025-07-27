'use client';

// ============ Imports ============
import {
  StarIcon,
  EyeIcon,
  ShareIcon,
  ArrowDownTrayIcon as DownloadIcon,
  CalendarDaysIcon,
  TrophyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { QuestBadge } from '../../hooks/useContracts';

// ============ Extended Types ============
export interface BadgeWithMetadata extends QuestBadge {
  tokenId: number;
  tokenURI?: string;
  questTitle: string;
  questReward: any;
  isValid: boolean;
}

// ============ Types ============
interface BadgeCardProps {
  badge: BadgeWithMetadata;
  viewMode: 'grid' | 'list';
  onView: () => void;
  onShare: () => void;
  onDownload: () => void;
}

/**
 * @title BadgeCard
 * @notice Individual NFT badge card component with multiple view modes
 * @dev Displays badge information with interactive actions
 */
export default function BadgeCard({ 
  badge, 
  viewMode, 
  onView, 
  onShare, 
  onDownload 
}: BadgeCardProps) {

  // ============ Helper Functions ============
  
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

  // ============ Grid View ============
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
        
        {/* Badge Image/Icon */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 h-48 flex items-center justify-center">
          <StarIcon className="h-20 w-20 text-white drop-shadow-lg" />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={onView}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110"
                title="View details"
              >
                <EyeIcon className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={onShare}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110"
                title="Share badge"
              >
                <ShareIcon className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={onDownload}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110"
                title="Download badge"
              >
                <DownloadIcon className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Badge Number */}
          <div className="absolute top-3 right-3 bg-black bg-opacity-30 text-white text-xs font-bold px-2 py-1 rounded-full">
            #{badge.tokenId}
          </div>

          {/* Validation Status */}
          {badge.isValid && (
            <div className="absolute top-3 left-3 bg-green-500 bg-opacity-90 text-white p-1 rounded-full">
              <CheckCircleIcon className="h-4 w-4" />
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
              <CalendarDaysIcon className="h-3 w-3 mr-1" />
              <span>{getTimeAgo(Number(badge.mintTime))}</span>
            </div>
            <div className="flex items-center text-green-600 font-medium">
              <TrophyIcon className="h-3 w-3 mr-1" />
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

  // ============ List View ============
  return (
    <div className="bg-white rounded-lg shadow-card border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-4">
        
        {/* Badge Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-lg flex items-center justify-center relative">
            <StarIcon className="h-8 w-8 text-white" />
            {badge.isValid && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full">
                <CheckCircleIcon className="h-3 w-3" />
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
              <CalendarDaysIcon className="h-3 w-3 mr-1" />
              <span>{formatDate(Number(badge.mintTime))}</span>
            </div>
            <div className="flex items-center text-green-600 font-medium">
              <TrophyIcon className="h-3 w-3 mr-1" />
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
            <EyeIcon className="h-4 w-4" />
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

// ============ Badge Preview Component ============
interface BadgePreviewProps {
  badge: BadgeWithMetadata;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function BadgePreview({ badge, size = 'md', showDetails = false }: BadgePreviewProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`
        ${sizeClasses[size]} bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 
        rounded-lg flex items-center justify-center relative flex-shrink-0
      `}>
        <StarIcon className={`${iconSizes[size]} text-white`} />
        {badge.isValid && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full">
            <CheckCircleIcon className="h-2 w-2" />
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {badge.questTitle}
          </p>
          <p className="text-xs text-gray-500">
            Quest #{badge.questId.toString()} • #{badge.tokenId}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ Badge Rarity Component ============
interface BadgeRarityProps {
  badge: BadgeWithMetadata;
  totalSupply: number;
  className?: string;
}

export function BadgeRarity({ badge, className = "" }: BadgeRarityProps) {
  // Calculate rarity based on quest completion rate
  // This is a simplified calculation - in production you might want more sophisticated rarity metrics
  const completionRate = Number(badge.questId) <= 1 ? 0.1 : Math.random() * 0.5; // Mock data
  
  const getRarityLevel = (rate: number) => {
    if (rate < 0.1) return { label: 'Legendary', color: 'text-purple-600 bg-purple-100' };
    if (rate < 0.25) return { label: 'Epic', color: 'text-blue-600 bg-blue-100' };
    if (rate < 0.5) return { label: 'Rare', color: 'text-green-600 bg-green-100' };
    return { label: 'Common', color: 'text-gray-600 bg-gray-100' };
  };

  const rarity = getRarityLevel(completionRate);

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`
        px-2 py-1 rounded-full text-xs font-medium border
        ${rarity.color}
      `}>
        ⭐ {rarity.label}
      </span>
      <span className="ml-2 text-xs text-gray-500">
        {(completionRate * 100).toFixed(1)}% have this badge
      </span>
    </div>
  );
}

// ============ Badge Stats Component ============
interface BadgeStatsProps {
  badge: BadgeWithMetadata;
  className?: string;
}

export function BadgeStats({ badge, className = "" }: BadgeStatsProps) {
  return (
    <div className={`grid grid-cols-3 gap-4 text-center ${className}`}>
      <div>
        <div className="text-lg font-bold text-gray-900">
          #{badge.tokenId}
        </div>
        <div className="text-xs text-gray-600">Token ID</div>
      </div>
      <div>
        <div className="text-lg font-bold text-green-600">
          {(Number(badge.questReward) / 1e6).toFixed(1)}
        </div>
        <div className="text-xs text-gray-600">USDC Earned</div>
      </div>
      <div>
        <div className="text-lg font-bold text-blue-600">
          {new Date(Number(badge.mintTime) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="text-xs text-gray-600">Date Earned</div>
      </div>
    </div>
  );
}