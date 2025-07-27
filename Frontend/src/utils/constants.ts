// ============ Network Configuration ============

/**
 * Etherlink Network Configuration
 */
export const ETHERLINK_CONFIG = {
    CHAIN_ID: 42793,
    NAME: 'Etherlink Testnet',
    SYMBOL: 'XTZ',
    DECIMALS: 18,
    RPC_URL: process.env.NEXT_PUBLIC_ETHERLINK_RPC_URL || 'https://node.ghostnet.etherlink.com',
    EXPLORER_URL: 'https://explorer.etherlink.com',
    TESTNET: true,
  } as const;
  
  /**
   * Contract Addresses (will be populated after deployment)
   */
  export const CONTRACT_ADDRESSES = {
    STAKING_POOL: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS || '',
    QUEST_MANAGER: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS || '',
    NFT_MINTER: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS || '',
    USDC_TOKEN: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', // USDC testnet
  } as const;
  
  // ============ Quest Configuration ============
  
  /**
   * Quest Types and Parameters
   */
  export const QUEST_CONFIG = {
    TYPES: {
      SOCIAL_MEDIA: 'social_media',
      ON_CHAIN: 'on_chain',
      COMMUNITY: 'community',
    },
    
    CURRENT_QUEST: {
      ID: 'etherlink-tweet-quest',
      TYPE: 'social_media',
      TITLE: 'Tweet about Etherlink Quest',
      DESCRIPTION: 'Post a tweet with #EtherlinkQuest hashtag and tag our account',
      REWARD_AMOUNT: '1', // 1 USDC
      REWARD_TOKEN: 'USDC',
      HASHTAG: '#EtherlinkQuest',
      TWITTER_HANDLE: '@EtherlinkQuest',
      MAX_COMPLETIONS: null, // unlimited for MVP
    },
    
    VALIDATION: {
      MIN_TWEET_LENGTH: 50,
      REQUIRED_HASHTAG: '#EtherlinkQuest',
      TWITTER_URL_PATTERN: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/,
      VERIFICATION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    },
  } as const;
  
  // ============ Token Configuration ============
  
  /**
   * Supported Tokens
   */
  export const TOKENS = {
    USDC: {
      ADDRESS: CONTRACT_ADDRESSES.USDC_TOKEN,
      SYMBOL: 'USDC',
      NAME: 'USD Coin',
      DECIMALS: 6,
      LOGO_URL: '/tokens/usdc.png',
    },
    
    XTZ: {
      ADDRESS: 'native',
      SYMBOL: 'XTZ',
      NAME: 'Tezos',
      DECIMALS: 18,
      LOGO_URL: '/tokens/xtz.png',
    },
  } as const;
  
  /**
   * Token Amounts and Limits
   */
  export const TOKEN_LIMITS = {
    MIN_STAKE_AMOUNT: '1', // 1 USDC minimum stake
    MAX_STAKE_AMOUNT: '10000', // 10,000 USDC maximum stake
    QUEST_REWARD_AMOUNT: '1', // 1 USDC per quest completion
    DECIMAL_PRECISION: 6, // USDC has 6 decimals
  } as const;
  
  // ============ UI Configuration ============
  
  /**
   * Application Routes
   */
  export const ROUTES = {
    HOME: '/',
    STAKING: '/staking',
    QUESTS: '/quests',
    DASHBOARD: '/dashboard',
    ADMIN: '/admin',
  } as const;
  
  /**
   * Navigation Menu Items
   */
  export const NAVIGATION = [
    { name: 'Home', href: ROUTES.HOME },
    { name: 'Quests', href: ROUTES.QUESTS },
    { name: 'Staking', href: ROUTES.STAKING },
    { name: 'Dashboard', href: ROUTES.DASHBOARD },
  ] as const;
  
  /**
   * UI Constants
   */
  export const UI_CONFIG = {
    TOAST_DURATION: {
      SUCCESS: 5000,
      ERROR: 8000,
      WARNING: 6000,
      INFO: 5000,
      LOADING: 0, // Manual dismiss
    },
    
    MODAL_ANIMATION_DURATION: 300,
    LOADING_DEBOUNCE: 500,
    REFETCH_INTERVAL: 30000, // 30 seconds
    
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,
    },
    
    BREAKPOINTS: {
      SM: 640,
      MD: 768,
      LG: 1024,
      XL: 1280,
      '2XL': 1536,
    },
  } as const;
  
  // ============ API Configuration ============
  
  /**
   * Third-party Service URLs
   */
  export const API_ENDPOINTS = {
    THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
    SEQUENCE_API_URL: 'https://api.sequence.app',
    GOLDSKY_API_URL: process.env.NEXT_PUBLIC_GOLDSKY_API_URL || '',
    TWITTER_API_URL: 'https://api.twitter.com/2',
  } as const;
  
  /**
   * Sequence Configuration
   */
  export const SEQUENCE_CONFIG = {
    PROJECT_ACCESS_KEY: process.env.NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY || '',
    NETWORK: 'testnet',
    NFT_COLLECTION_ADDRESS: process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS || '',
  } as const;
  
  /**
   * Goldsky Subgraph Configuration
   */
  export const GOLDSKY_CONFIG = {
    SUBGRAPH_URL: process.env.NEXT_PUBLIC_GOLDSKY_SUBGRAPH_URL || '',
    API_KEY: process.env.NEXT_PUBLIC_GOLDSKY_API_KEY || '',
  } as const;
  
  // ============ Error Messages ============
  
  /**
   * Standard Error Messages
   */
  export const ERROR_MESSAGES = {
    WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
    INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
    TRANSACTION_FAILED: 'Transaction failed. Please try again',
    NETWORK_ERROR: 'Network error. Please check your connection',
    INVALID_AMOUNT: 'Please enter a valid amount',
    QUEST_ALREADY_COMPLETED: 'You have already completed this quest',
    INVALID_TWEET_URL: 'Please provide a valid Twitter URL',
    VERIFICATION_FAILED: 'Quest verification failed. Please check your submission',
    ADMIN_ACCESS_DENIED: 'Admin access required for this action',
    CONTRACT_INTERACTION_FAILED: 'Smart contract interaction failed',
    
    // Staking specific
    MINIMUM_STAKE_NOT_MET: `Minimum stake amount is ${TOKEN_LIMITS.MIN_STAKE_AMOUNT} USDC`,
    MAXIMUM_STAKE_EXCEEDED: `Maximum stake amount is ${TOKEN_LIMITS.MAX_STAKE_AMOUNT} USDC`,
    INSUFFICIENT_POOL_BALANCE: 'Insufficient pool balance for quest rewards',
    
    // Quest specific
    QUEST_SUBMISSION_FAILED: 'Failed to submit quest. Please try again',
    INVALID_QUEST_PROOF: 'Invalid quest proof provided',
    QUEST_VERIFICATION_TIMEOUT: 'Quest verification timed out',
    NFT_MINTING_FAILED: 'Failed to mint NFT badge',
  } as const;
  
  /**
   * Success Messages
   */
  export const SUCCESS_MESSAGES = {
    WALLET_CONNECTED: 'Wallet connected successfully',
    STAKE_SUCCESS: 'USDC staked successfully',
    UNSTAKE_SUCCESS: 'USDC unstaked successfully',
    QUEST_SUBMITTED: 'Quest submitted for verification',
    QUEST_COMPLETED: 'Quest completed! Reward and NFT will be distributed shortly',
    NFT_MINTED: 'NFT badge minted successfully',
    TRANSACTION_CONFIRMED: 'Transaction confirmed on blockchain',
    
    // Admin specific
    QUEST_VERIFIED: 'Quest verified and rewards distributed',
    QUEST_REJECTED: 'Quest submission rejected',
    SETTINGS_UPDATED: 'Settings updated successfully',
  } as const;
  
  // ============ Feature Flags ============
  
  /**
   * Feature toggles for development and production
   */
  export const FEATURES = {
    ENABLE_STAKING: true,
    ENABLE_QUEST_SUBMISSION: true,
    ENABLE_NFT_MINTING: true,
    ENABLE_ADMIN_PANEL: true,
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
    ENABLE_GOLDSKY_INDEXING: true,
    ENABLE_AUTO_VERIFICATION: false, // Manual verification for MVP
    ENABLE_MULTIPLE_QUESTS: false, // Single quest for MVP
  } as const;
  
  // ============ Time Constants ============
  
  /**
   * Time-related constants in milliseconds
   */
  export const TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    
    // Specific timeouts
    TRANSACTION_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    QUEST_VERIFICATION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    WALLET_CONNECTION_TIMEOUT: 60 * 1000, // 1 minute
    API_REQUEST_TIMEOUT: 30 * 1000, // 30 seconds
  } as const;
  
  // ============ Gas Configuration ============
  
  /**
   * Gas limits and prices for Etherlink transactions
   */
  export const GAS_CONFIG = {
    LIMITS: {
      STAKE: 150000,
      UNSTAKE: 100000,
      QUEST_SUBMIT: 80000,
      QUEST_VERIFY: 120000,
      NFT_MINT: 200000,
      TOKEN_APPROVAL: 60000,
    },
    
    PRICE: {
      SLOW: '1000000000', // 1 gwei
      STANDARD: '2000000000', // 2 gwei
      FAST: '5000000000', // 5 gwei
    },
    
    // Etherlink typically has very low gas costs
    MULTIPLIER: 1.1, // 10% buffer
  } as const;
  
  // ============ Validation Rules ============
  
  /**
   * Input validation constants
   */
  export const VALIDATION = {
    WALLET_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    TWITTER_URL: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/,
    AMOUNT: /^\d+(\.\d{1,6})?$/, // Up to 6 decimal places for USDC
    
    MIN_LENGTHS: {
      TWEET: 50,
      QUEST_DESCRIPTION: 100,
    },
    
    MAX_LENGTHS: {
      TWEET_URL: 200,
      QUEST_TITLE: 100,
      QUEST_DESCRIPTION: 500,
      USER_INPUT: 1000,
    },
  } as const;
  
  // ============ Local Storage Keys ============
  
  /**
   * Keys for localStorage and sessionStorage
   */
  export const STORAGE_KEYS = {
    WALLET_PREFERENCES: 'quest_wallet_prefs',
    USER_SETTINGS: 'quest_user_settings',
    QUEST_DRAFTS: 'quest_drafts',
    ADMIN_SETTINGS: 'quest_admin_settings',
    THEME_PREFERENCE: 'quest_theme',
    LAST_VISITED_PAGE: 'quest_last_page',
  } as const;
  
  // ============ Social Media Configuration ============
  
  /**
   * Social media platform configurations
   */
  export const SOCIAL_CONFIG = {
    TWITTER: {
      PLATFORM: 'twitter',
      BASE_URL: 'https://twitter.com/',
      SHARE_URL: 'https://twitter.com/intent/tweet',
      HASHTAG: '#EtherlinkQuest',
      HANDLE: '@EtherlinkQuest',
      URL_PATTERNS: [
        /^https?:\/\/(www\.)?twitter\.com\/\w+\/status\/\d+/,
        /^https?:\/\/(www\.)?x\.com\/\w+\/status\/\d+/,
      ],
    },
    
    DISCORD: {
      PLATFORM: 'discord',
      INVITE_URL: process.env.NEXT_PUBLIC_DISCORD_INVITE || '',
      CHANNEL_ID: process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID || '',
    },
    
    TELEGRAM: {
      PLATFORM: 'telegram',
      CHANNEL_URL: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL || '',
      BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT || '',
    },
  } as const;
  
  // ============ Analytics Configuration ============
  
  /**
   * Analytics and tracking configuration
   */
  export const ANALYTICS_CONFIG = {
    GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GA_ID || '',
    MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    
    EVENTS: {
      // Wallet events
      WALLET_CONNECTED: 'wallet_connected',
      WALLET_DISCONNECTED: 'wallet_disconnected',
      
      // Staking events
      STAKE_INITIATED: 'stake_initiated',
      STAKE_COMPLETED: 'stake_completed',
      UNSTAKE_INITIATED: 'unstake_initiated',
      UNSTAKE_COMPLETED: 'unstake_completed',
      
      // Quest events
      QUEST_VIEWED: 'quest_viewed',
      QUEST_SUBMITTED: 'quest_submitted',
      QUEST_COMPLETED: 'quest_completed',
      QUEST_FAILED: 'quest_failed',
      
      // NFT events
      NFT_MINTED: 'nft_minted',
      NFT_VIEWED: 'nft_viewed',
      
      // Admin events
      ADMIN_LOGIN: 'admin_login',
      QUEST_VERIFIED: 'quest_verified',
      QUEST_REJECTED: 'quest_rejected',
      
      // Error events
      TRANSACTION_FAILED: 'transaction_failed',
      CONTRACT_ERROR: 'contract_error',
      NETWORK_ERROR: 'network_error',
    },
  } as const;
  
  // ============ Development Configuration ============
  
  /**
   * Development and debugging constants
   */
  export const DEV_CONFIG = {
    ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
    MOCK_DATA_ENABLED: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
    SKIP_WALLET_CONNECTION: process.env.NEXT_PUBLIC_SKIP_WALLET === 'true',
    
    MOCK_ADDRESSES: {
      USER: '0x742d35Cc6609C4532c79aE4B5be98f90F36A0b85',
      ADMIN: '0x8ba1f109551bD432803012645Hac136c27c5342b',
    },
    
    TEST_QUEST_DATA: {
      TWEET_URL: 'https://twitter.com/user/status/1234567890',
      REWARD_AMOUNT: '1.0',
      NFT_TOKEN_ID: '1',
    },
  } as const;
  
  // ============ Security Configuration ============
  
  /**
   * Security-related constants
   */
  export const SECURITY_CONFIG = {
    MAX_APPROVAL_AMOUNT: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // 2^256 - 1
    
    RATE_LIMITS: {
      QUEST_SUBMISSIONS_PER_HOUR: 5,
      STAKE_TRANSACTIONS_PER_HOUR: 20,
      API_REQUESTS_PER_MINUTE: 60,
    },
    
    TIMEOUTS: {
      TRANSACTION: 5 * 60 * 1000, // 5 minutes
      API_REQUEST: 30 * 1000, // 30 seconds
      WALLET_CONNECTION: 60 * 1000, // 1 minute
    },
    
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'https://quest-dapp.vercel.app',
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean),
  } as const;
  
  // ============ Metadata Configuration ============
  
  /**
   * NFT and metadata configuration
   */
  export const METADATA_CONFIG = {
    NFT_BASE_URI: process.env.NEXT_PUBLIC_NFT_BASE_URI || 'https://api.quest-dapp.com/metadata/',
    
    QUEST_BADGE_METADATA: {
      NAME: 'Quest Completion Badge',
      DESCRIPTION: 'A unique NFT badge proving completion of an Etherlink Quest',
      IMAGE_BASE_URL: '/nft-badges/',
      ATTRIBUTES: [
        { trait_type: 'Quest Type', value: 'Social Media' },
        { trait_type: 'Network', value: 'Etherlink' },
        { trait_type: 'Reward', value: '1 USDC' },
      ],
    },
    
    COLLECTION_METADATA: {
      NAME: 'Etherlink Quest Badges',
      DESCRIPTION: 'Official NFT badges for completing Etherlink Quest challenges',
      EXTERNAL_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://quest-dapp.com',
      SELLER_FEE_BASIS_POINTS: 0, // 0% royalty for MVP
    },
  } as const;
  
  // ============ Export All Constants ============
  export default {
    ETHERLINK_CONFIG,
    CONTRACT_ADDRESSES,
    QUEST_CONFIG,
    TOKENS,
    TOKEN_LIMITS,
    ROUTES,
    NAVIGATION,
    UI_CONFIG,
    API_ENDPOINTS,
    SEQUENCE_CONFIG,
    GOLDSKY_CONFIG,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    FEATURES,
    TIME,
    GAS_CONFIG,
    VALIDATION,
    STORAGE_KEYS,
    SOCIAL_CONFIG,
    ANALYTICS_CONFIG,
    DEV_CONFIG,
    SECURITY_CONFIG,
    METADATA_CONFIG,
  } as const;