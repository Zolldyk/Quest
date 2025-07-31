'use client';

// ============ Imports ============
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  XMarkIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { Quest, useQuestManager, formatTokenAmount } from '../../hooks/useContracts';
import LoadingSpinner from '../ui/LoadingSpinner';

// ============ Types ============
interface QuestSubmissionFormProps {
  quest: Quest;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * @title QuestSubmissionForm
 * @notice Modal form for submitting quest completion proof
 * @dev Handles quest submission with URL validation and user guidance
 */
export default function QuestSubmissionForm({ 
  quest, 
  onClose, 
  onSuccess 
}: QuestSubmissionFormProps) {

  // ============ Hooks ============
  const { submitQuestProof, isSubmitting } = useQuestManager();

  // ============ State ============
  const [tweetUrl, setTweetUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [step, setStep] = useState<'instructions' | 'submit'>('instructions');

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // ============ URL Validation ============
  const validateTweetUrl = (url: string): { isValid: boolean; error: string } => {
    if (!url.trim()) {
      return { isValid: false, error: '' };
    }

    // Basic URL format check
    try {
      const urlObj = new URL(url);
      
      // Check if it's a Twitter/X URL
      const validDomains = ['twitter.com', 'x.com', 'mobile.twitter.com', 'm.twitter.com'];
      const isTwitterDomain = validDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname === `www.${domain}`
      );
      
      if (!isTwitterDomain) {
        return { 
          isValid: false, 
          error: 'Please provide a valid Twitter/X post URL' 
        };
      }

      // Check if it looks like a tweet URL pattern
      const tweetPattern = /\/(status|statuses)\/\d+/;
      if (!tweetPattern.test(urlObj.pathname)) {
        return { 
          isValid: false, 
          error: 'URL should link to a specific tweet/post' 
        };
      }

      return { isValid: true, error: '' };
    } catch {
      return { 
        isValid: false, 
        error: 'Please enter a valid URL' 
      };
    }
  };

  // ============ Handlers ============
  const handleUrlChange = (value: string) => {
    setTweetUrl(value);
    const validation = validateTweetUrl(value);
    setIsValidUrl(validation.isValid);
    setUrlError(validation.error);
  };

  const handleSubmit = async () => {
    console.log('🚀 QuestSubmissionForm: Starting handleSubmit', {
      isValidUrl,
      tweetUrl: tweetUrl.trim(),
      questId: quest.questId.toString(),
      submitQuestProof: !!submitQuestProof
    });

    if (!isValidUrl || !tweetUrl.trim()) {
      console.log('❌ QuestSubmissionForm: Invalid URL or empty tweet URL');
      toast.error('Please provide a valid tweet URL');
      return;
    }

    if (!submitQuestProof) {
      console.log('❌ QuestSubmissionForm: submitQuestProof function not available');
      toast.error('Contract connection not available. Please refresh and try again.');
      return;
    }

    try {
      console.log('🔄 QuestSubmissionForm: Calling submitQuestProof...', {
        questId: Number(quest.questId),
        tweetUrl: tweetUrl.trim()
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Submission timed out')), 30000)
      );
      
      const submissionPromise = submitQuestProof(Number(quest.questId), tweetUrl.trim());
      
      const result = await Promise.race([submissionPromise, timeoutPromise]);
      
      console.log('✅ QuestSubmissionForm: Submission successful', result);
      toast.success('Quest submitted successfully! Check your dashboard for verification status.');
      onSuccess();
    } catch (error: any) {
      console.error('❌ QuestSubmissionForm: Submission failed', {
        error,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      // Provide user-friendly error messages
      let errorMessage = 'Failed to submit quest. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          errorMessage = 'Transaction was rejected. Please try again.';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient funds for transaction fees.';
        } else if (error.message.includes('QuestManager__QuestAlreadySubmitted')) {
          errorMessage = 'You have already submitted this quest. Check your dashboard for verification status.';
        } else if (error.message.includes('QuestManager__PlayerAlreadyCompleted')) {
          errorMessage = 'You have already completed this quest. Check your dashboard for your rewards.';
        } else if (error.message.includes('QuestManager__QuestNotActive')) {
          errorMessage = 'This quest is no longer active.';
        } else if (error.message.includes('QuestManager__EmptyTweetUrl')) {
          errorMessage = 'Please provide a valid tweet URL.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('Contract not available')) {
          errorMessage = 'Smart contract is not available. Please check your network connection.';
        } else if (error.message.includes('No account connected')) {
          errorMessage = 'Please connect your wallet and try again.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'Transaction timed out. Please try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCopyHashtag = () => {
    navigator.clipboard.writeText('#EtherlinkQuest');
    toast.success('Hashtag copied to clipboard!');
  };

  const handleCopyRequirements = () => {
    navigator.clipboard.writeText(quest.requirements);
    toast.success('Requirements copied to clipboard!');
  };

  // ============ JSX Return ============
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {quest.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Reward: {formatTokenAmount(quest.rewardAmount, 6)} USDC + NFT Badge
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            type="button"
            aria-label="Close dialog"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'instructions' ? (
            <InstructionsStep
              quest={quest}
              onNext={() => setStep('submit')}
              onCopyHashtag={handleCopyHashtag}
              onCopyRequirements={handleCopyRequirements}
            />
          ) : (
            <SubmissionStep
              quest={quest}
              tweetUrl={tweetUrl}
              isValidUrl={isValidUrl}
              urlError={urlError}
              isSubmitting={isSubmitting}
              onUrlChange={handleUrlChange}
              onSubmit={handleSubmit}
              onBack={() => setStep('instructions')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Instructions Step ============
interface InstructionsStepProps {
  quest: Quest;
  onNext: () => void;
  onCopyHashtag: () => void;
  onCopyRequirements: () => void;
}

function InstructionsStep({ 
  quest, 
  onNext, 
  onCopyHashtag, 
  onCopyRequirements 
}: InstructionsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          How to Complete This Quest
        </h3>
        <p className="text-gray-600">
          Follow these steps to complete the quest and earn your reward:
        </p>
      </div>

      {/* Quest Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Quest Requirements
        </h4>
        <div className="text-blue-800 text-sm bg-white rounded p-3 font-mono">
          {quest.requirements}
        </div>
        <button
          onClick={onCopyRequirements}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
          Copy requirements
        </button>
      </div>

      {/* Step-by-step instructions */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
            1
          </div>
          <div>
            <p className="font-medium text-gray-900">Go to Twitter/X</p>
            <p className="text-sm text-gray-600">
              Open Twitter/X in a new tab to create your post
            </p>
            <a
              href="https://twitter.com/intent/tweet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
              Open Twitter
            </a>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
            2
          </div>
          <div>
            <p className="font-medium text-gray-900">Create your post</p>
            <p className="text-sm text-gray-600">
              Write a post that includes the required hashtag and mentions
            </p>
            <div className="mt-2 bg-gray-50 rounded p-2 text-sm font-mono flex items-center justify-between">
              <span className="text-blue-600">#EtherlinkQuest</span>
              <button
                onClick={onCopyHashtag}
                className="text-blue-600 hover:text-blue-800"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
            3
          </div>
          <div>
            <p className="font-medium text-gray-900">Publish your post</p>
            <p className="text-sm text-gray-600">
              Make sure your post is public so it can be verified
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
            4
          </div>
          <div>
            <p className="font-medium text-gray-900">Copy the post URL</p>
            <p className="text-sm text-gray-600">
              Copy the direct link to your tweet and submit it below
            </p>
          </div>
        </div>
      </div>

      {/* Important notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your post must be public to be verified</li>
          <li>• Include exactly the hashtag and mentions as specified</li>
          <li>• Each wallet can only complete this quest once</li>
          <li>• Verification may take a few minutes to several hours</li>
        </ul>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNext();
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        I&apos;ve completed the task - Submit proof
      </button>
    </div>
  );
}

// ============ Submission Step ============
interface SubmissionStepProps {
  quest: Quest;
  tweetUrl: string;
  isValidUrl: boolean;
  urlError: string;
  isSubmitting: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function SubmissionStep({
  quest,
  tweetUrl,
  isValidUrl,
  urlError,
  isSubmitting,
  onUrlChange,
  onSubmit,
  onBack
}: SubmissionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Submit Your Quest Proof
        </h3>
        <p className="text-gray-600">
          Paste the URL of your completed post below for verification.
        </p>
      </div>

      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Post URL <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="url"
            value={tweetUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              urlError 
                ? 'border-red-300 bg-red-50' 
                : isValidUrl 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300'
            }`}
            placeholder="https://twitter.com/username/status/123456789..."
          />
          {isValidUrl && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
        
        {/* URL Validation Messages */}
        {urlError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {urlError}
          </p>
        )}
        {isValidUrl && (
          <p className="mt-1 text-sm text-green-600 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Valid tweet URL
          </p>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          Example: https://twitter.com/yourhandle/status/1234567890123456789
        </p>
      </div>

      {/* Preview */}
      {isValidUrl && tweetUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Submission Preview:</h4>
          <div className="text-sm text-gray-700">
            <p><strong>Quest:</strong> {quest.title}</p>
            <p><strong>Proof URL:</strong> {tweetUrl}</p>
            <p><strong>Reward:</strong> {formatTokenAmount(quest.rewardAmount, 6)} USDC + NFT Badge</p>
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Your submission will be reviewed by an admin</li>
          <li>2. We&apos;ll verify that your post meets the requirements</li>
          <li>3. Upon approval, you&apos;ll receive your USDC reward</li>
          <li>4. Your NFT badge will be minted automatically</li>
          <li>5. Check your dashboard for updates on the verification status</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Back to Instructions
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isValidUrl || isSubmitting) {
              return;
            }
            
            onSubmit();
          }}
          disabled={!isValidUrl || isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Quest'
          )}
        </button>
      </div>
    </div>
  );
}