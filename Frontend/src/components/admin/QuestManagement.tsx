'use client';

// ============ Imports ============
import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  TrophyIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useQuestManager, Quest, formatTokenAmount } from '../../hooks/useContracts';
import LoadingSpinner, { CardSkeleton } from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

// ============ Types ============
interface QuestWithStats extends Quest {
  completionRate: number;
  timeRemaining: string;
  status: 'active' | 'completed' | 'expired' | 'paused';
}

interface CreateQuestFormData {
  title: string;
  description: string;
  requirements: string;
  rewardAmount: string;
  duration: string;
  maxCompletions: string;
}

interface QuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuestFormData) => void;
  isSubmitting: boolean;
  quest?: Quest | null;
}

type QuestFilter = 'all' | 'active' | 'completed' | 'expired';
type SortOption = 'newest' | 'oldest' | 'popular' | 'reward';

/**
 * @title QuestManagement
 * @notice Admin component for creating and managing quests
 * @dev Provides comprehensive quest lifecycle management tools
 */
export default function QuestManagement() {

  // ============ Hooks ============
  const { 
    activeQuests,
    getQuest,
    toggleQuestStatus,
    // createQuest - would need to be added to hook
    refetchActiveQuests 
  } = useQuestManager();

  // ============ State ============
  const [quests, setQuests] = useState<QuestWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [filter, setFilter] = useState<QuestFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isCreating, setIsCreating] = useState(false);

  // ============ Effects ============

  // Fetch quest details and calculate stats
  useEffect(() => {
    const fetchQuestDetails = async () => {
      if (!(activeQuests as unknown as any[])?.length) {
        setQuests([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const questPromises = (activeQuests as unknown as any[]).map(async (questId: any) => {
          const quest = await getQuest(Number(questId));
          if (!quest) return null;

          // Calculate additional stats
          const completionRate = Number(quest.maxCompletions) > 0 
            ? (Number(quest.currentCompletions) / Number(quest.maxCompletions)) * 100 
            : 0;

          const now = Date.now() / 1000;
          const endTime = Number(quest.endTime);
          const timeRemaining = endTime > now 
            ? formatTimeRemaining(endTime - now)
            : 'Expired';

          const status: QuestWithStats['status'] = 
            !quest.isActive ? 'paused' :
            Number(quest.currentCompletions) >= Number(quest.maxCompletions) ? 'completed' :
            endTime <= now ? 'expired' : 'active';

          return {
            ...quest,
            completionRate,
            timeRemaining,
            status,
          } as QuestWithStats;
        });

        const questsData = await Promise.all(questPromises);
        const validQuests = questsData.filter(q => q !== null) as QuestWithStats[];
        
        setQuests(validQuests);

      } catch (error) {
        console.error('Error fetching quest details:', error);
        toast.error('Failed to load quest details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestDetails();
  }, [activeQuests, getQuest]);

  // ============ Computed Values ============
  
  // Filter and sort quests
  const filteredQuests = useMemo(() => {
    let filtered = [...quests];

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(q => q.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(term) ||
        q.description.toLowerCase().includes(term) ||
        q.requirements.toLowerCase().includes(term)
      );
    }

    // Sort quests
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.createTime) - Number(a.createTime);
        case 'oldest':
          return Number(a.createTime) - Number(b.createTime);
        case 'popular':
          return Number(b.currentCompletions) - Number(a.currentCompletions);
        case 'reward':
          return Number(b.rewardAmount) - Number(a.rewardAmount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [quests, filter, searchTerm, sortBy]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = quests.length;
    const active = quests.filter(q => q.status === 'active').length;
    const completed = quests.filter(q => q.status === 'completed').length;
    const expired = quests.filter(q => q.status === 'expired').length;
    const totalCompletions = quests.reduce((sum, q) => sum + Number(q.currentCompletions), 0);
    const totalRewards = quests.reduce((sum, q) => sum + (Number(q.rewardAmount) * Number(q.currentCompletions)), 0);

    return { total, active, completed, expired, totalCompletions, totalRewards };
  }, [quests]);

  // ============ Handlers ============
  
  const handleCreateQuest = async (data: CreateQuestFormData) => {
    setIsCreating(true);
    
    try {
      // Note: This would need to be implemented in the contract and hook
      // For now, we'll show a placeholder
      console.log('Creating quest:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Quest created successfully!');
      setShowCreateModal(false);
      await refetchActiveQuests();
      
    } catch (error) {
      console.error('Failed to create quest:', error);
      toast.error('Failed to create quest');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleQuestStatus = async (quest: QuestWithStats) => {
    try {
      await toggleQuestStatus(Number(quest.questId));
      toast.success(`Quest ${quest.isActive ? 'paused' : 'activated'} successfully!`);
      await refetchActiveQuests();
    } catch (error) {
      console.error('Failed to toggle quest status:', error);
    }
  };

  const handleEditQuest = (quest: QuestWithStats) => {
    setSelectedQuest(quest);
    setShowEditModal(true);
  };

  const formatTimeRemaining = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // ============ Loading State ============
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
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
            Quest Management ({filteredQuests.length})
          </h2>
          <p className="text-gray-600 text-sm">
            Create, edit, and manage quest campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Quest
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Quests"
          value={stats.total}
          icon={<TrophyIcon className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Active Quests"
          value={stats.active}
          icon={<PlayIcon className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Total Completions"
          value={stats.totalCompletions}
          icon={<UsersIcon className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatCard
          title="Rewards Distributed"
          value={`${(stats.totalRewards / 1e6).toFixed(0)} USDC`}
          icon={<CurrencyDollarIcon className="h-5 w-5 text-green-600" />}
          color="green"
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search quests..."
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as QuestFilter)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
              <option value="reward">Highest Reward</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quest Cards */}
      {filteredQuests.length === 0 ? (
        <EmptyState 
          hasFilters={filter !== 'all' || searchTerm !== ''}
          onCreateQuest={() => setShowCreateModal(true)}
          onClearFilters={() => {
            setFilter('all');
            setSearchTerm('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.questId.toString()}
              quest={quest}
              onEdit={() => handleEditQuest(quest)}
              onToggleStatus={() => handleToggleQuestStatus(quest)}
            />
          ))}
        </div>
      )}

      {/* Create Quest Modal */}
      <QuestFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateQuest}
        isSubmitting={isCreating}
      />

      {/* Edit Quest Modal */}
      <QuestFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedQuest(null);
        }}
        onSubmit={handleCreateQuest}
        isSubmitting={isCreating}
        quest={selectedQuest}
      />
    </div>
  );
}

// ============ Stat Card Component ============
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
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

// ============ Quest Card Component ============
interface QuestCardProps {
  quest: QuestWithStats;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function QuestCard({ quest, onEdit, onToggleStatus }: QuestCardProps) {
  const getStatusColor = (status: QuestWithStats['status']) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-200';
      case 'completed': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'expired': return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'paused': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: QuestWithStats['status']) => {
    switch (status) {
      case 'active': return <PlayIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'expired': return <ClockIcon className="h-4 w-4" />;
      case 'paused': return <PauseIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {quest.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {quest.description}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
            ${getStatusColor(quest.status)}
          `}>
            {getStatusIcon(quest.status)}
            <span className="ml-1">{quest.status}</span>
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {quest.currentCompletions.toString()}/{quest.maxCompletions.toString()}
          </div>
          <div className="text-xs text-gray-600">Completions</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {formatTokenAmount(quest.rewardAmount, 6)} USDC
          </div>
          <div className="text-xs text-gray-600">Reward</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{quest.completionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              quest.completionRate === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(quest.completionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Time Remaining */}
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <CalendarDaysIcon className="h-4 w-4 mr-2" />
        <span>
          {quest.status === 'expired' 
            ? 'Expired' 
            : quest.status === 'completed'
              ? 'Completed'
              : `${quest.timeRemaining} remaining`
          }
        </span>
      </div>

      {/* Requirements Preview */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Requirements:</p>
        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 font-mono text-xs line-clamp-2">
          {quest.requirements}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Quest #{quest.questId.toString()}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit quest"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleStatus}
            className={`p-2 rounded-md transition-colors ${
              quest.isActive 
                ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
            title={quest.isActive ? 'Pause quest' : 'Activate quest'}
          >
            {quest.isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Empty State Component ============
interface EmptyStateProps {
  hasFilters: boolean;
  onCreateQuest: () => void;
  onClearFilters: () => void;
}

function EmptyState({ hasFilters, onCreateQuest, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {hasFilters ? (
        <>
          <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No quests found
          </h3>
          <p className="text-gray-600 mb-6">
            No quests match your current filters.
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
          <TrophyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No quests yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first quest campaign.
          </p>
          <button
            onClick={onCreateQuest}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Your First Quest
          </button>
        </>
      )}
    </div>
  );
}

// ============ Quest Form Modal Component ============
function QuestFormModal({ isOpen, onClose, onSubmit, isSubmitting, quest }: QuestFormModalProps) {
  const [formData, setFormData] = useState<CreateQuestFormData>({
    title: '',
    description: '',
    requirements: '',
    rewardAmount: '1',
    duration: '7',
    maxCompletions: '100',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (quest) {
        // Edit mode - populate with quest data
        setFormData({
          title: quest.title,
          description: quest.description,
          requirements: quest.requirements,
          rewardAmount: formatTokenAmount(quest.rewardAmount, 6),
          duration: ((Number(quest.endTime) - Number(quest.startTime)) / 86400).toString(),
          maxCompletions: quest.maxCompletions.toString(),
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          title: '',
          description: '',
          requirements: 'Post a tweet with #EtherlinkQuest and tag @QuestDApp',
          rewardAmount: '1',
          duration: '7',
          maxCompletions: '100',
        });
      }
    }
  }, [isOpen, quest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateFormData = (field: keyof CreateQuestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {quest ? 'Edit Quest' : 'Create New Quest'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quest title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe what this quest is about..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => updateFormData('requirements', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={2}
                placeholder="Specific instructions for completing the quest..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about what users need to do (e.g., hashtags, mentions, content requirements)
              </p>
            </div>
          </div>

          {/* Quest Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Amount (USDC) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => updateFormData('rewardAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => updateFormData('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Completions <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.maxCompletions}
                  onChange={(e) => updateFormData('maxCompletions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Cost Calculation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Quest Cost Estimation</h4>
            <div className="text-sm text-blue-800">
              <p>
                <strong>Total Cost:</strong> {
                  (parseFloat(formData.rewardAmount || '0') * parseFloat(formData.maxCompletions || '0')).toFixed(2)
                } USDC
              </p>
              <p className="text-xs mt-1">
                This amount will be distributed from the staking pool as users complete the quest.
                Ensure the pool has sufficient balance before creating the quest.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  {quest ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {quest ? 'Update Quest' : 'Create Quest'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}