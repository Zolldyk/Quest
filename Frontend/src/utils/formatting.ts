// ============ Imports ============
import { TOKENS, TOKEN_LIMITS } from './constants';

// ============ Number Formatting ============

/**
 * Format a number with commas for thousands separators
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number as currency (USD)
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a large number with K, M, B suffixes
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string with suffix
 */
export function formatLargeNumber(value: number | string, decimals: number = 1): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return `${formatNumber(num / 1e9, decimals)}B`;
  }
  if (num >= 1e6) {
    return `${formatNumber(num / 1e6, decimals)}M`;
  }
  if (num >= 1e3) {
    return `${formatNumber(num / 1e3, decimals)}K`;
  }
  
  return formatNumber(num, decimals);
}

/**
 * Format a percentage value
 * @param value Number to format as percentage (0.1 = 10%)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0.00%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// ============ Token Formatting ============

/**
 * Format token amount with proper decimals
 * @param amount Token amount in wei/smallest unit
 * @param tokenSymbol Token symbol (USDC, XTZ, etc.)
 * @param showSymbol Whether to include token symbol
 * @returns Formatted token amount
 */
export function formatTokenAmount(
  amount: string | number | bigint,
  tokenSymbol: keyof typeof TOKENS = 'USDC',
  showSymbol: boolean = true
): string {
  try {
    const token = TOKENS[tokenSymbol];
    const decimals = token.DECIMALS;
    
    // Convert to number from wei/smallest unit
    let num: number;
    
    if (typeof amount === 'bigint') {
      num = Number(amount) / Math.pow(10, decimals);
    } else if (typeof amount === 'string') {
      // If string contains decimal, assume it's already formatted
      if (amount.includes('.')) {
        num = parseFloat(amount);
      } else {
        // Assume it's in wei/smallest unit
        num = parseInt(amount) / Math.pow(10, decimals);
      }
    } else {
      num = amount / Math.pow(10, decimals);
    }
    
    if (isNaN(num)) return showSymbol ? `0 ${token.SYMBOL}` : '0';
    
    // Format with appropriate decimal places
    const formattedAmount = formatNumber(num, decimals === 18 ? 4 : decimals);
    
    return showSymbol ? `${formattedAmount} ${token.SYMBOL}` : formattedAmount;
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return showSymbol ? `0 ${tokenSymbol}` : '0';
  }
}

/**
 * Convert token amount to wei/smallest unit
 * @param amount Human readable amount
 * @param tokenSymbol Token symbol
 * @returns Amount in wei/smallest unit as string
 */
export function parseTokenAmount(
  amount: string | number,
  tokenSymbol: keyof typeof TOKENS = 'USDC'
): string {
  try {
    const token = TOKENS[tokenSymbol];
    const decimals = token.DECIMALS;
    
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num) || num < 0) return '0';
    
    // Convert to wei/smallest unit
    const weiAmount = Math.floor(num * Math.pow(10, decimals));
    
    return weiAmount.toString();
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return '0';
  }
}

/**
 * Format token balance with appropriate precision
 * @param balance Token balance in wei/smallest unit
 * @param tokenSymbol Token symbol
 * @param showSymbol Whether to show token symbol
 * @returns Formatted balance
 */
export function formatBalance(
  balance: string | number | bigint,
  tokenSymbol: keyof typeof TOKENS = 'USDC',
  showSymbol: boolean = true
): string {
  try {
    const formattedAmount = formatTokenAmount(balance, tokenSymbol, false);
    const num = parseFloat(formattedAmount);
    
    if (num === 0) {
      return showSymbol ? `0 ${TOKENS[tokenSymbol].SYMBOL}` : '0';
    }
    
    // Show more precision for small amounts
    let decimals = 2;
    if (num < 0.01) decimals = 6;
    else if (num < 1) decimals = 4;
    
    const formatted = formatNumber(num, decimals);
    return showSymbol ? `${formatted} ${TOKENS[tokenSymbol].SYMBOL}` : formatted;
  } catch (error) {
    console.error('Error formatting balance:', error);
    return showSymbol ? `0 ${tokenSymbol}` : '0';
  }
}

// ============ Address Formatting ============

/**
 * Truncate wallet address for display
 * @param address Wallet address
 * @param startLength Number of characters at start
 * @param endLength Number of characters at end
 * @returns Truncated address
 */
export function formatAddress(
  address: string | null | undefined,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address || address.length < startLength + endLength) {
    return address || '';
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format transaction hash for display
 * @param hash Transaction hash
 * @returns Formatted transaction hash
 */
export function formatTxHash(hash: string | null | undefined): string {
  return formatAddress(hash, 8, 6);
}

/**
 * Get Etherlink explorer URL for address
 * @param address Wallet address
 * @returns Explorer URL
 */
export function getAddressExplorerUrl(address: string): string {
  return `https://explorer.etherlink.com/address/${address}`;
}

/**
 * Get Etherlink explorer URL for transaction
 * @param txHash Transaction hash
 * @returns Explorer URL
 */
export function getTxExplorerUrl(txHash: string): string {
  return `https://explorer.etherlink.com/tx/${txHash}`;
}

// ============ Time Formatting ============

/**
 * Format timestamp to human readable date
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @param includeTime Whether to include time
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string, includeTime: boolean = false): string {
  try {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      // Handle both seconds and milliseconds
      const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
      date = new Date(ts);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number | string): string {
  try {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      // Handle both seconds and milliseconds
      const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
      date = new Date(ts);
    }
    
    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    // Less than 1 minute
    if (diffSeconds < 60) {
      return 'Just now';
    }
    
    // Less than 1 hour
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 day
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 week
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    // Older than a week, show actual date
    return formatDate(timestamp);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
}

/**
 * Format duration in milliseconds to human readable format
 * @param duration Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(duration: number): string {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ============ Quest Formatting ============

/**
 * Format quest status for display
 * @param status Quest status from contract
 * @returns Human readable status
 */
export function formatQuestStatus(status: string | number): string {
  const statusMap: Record<string | number, string> = {
    0: 'Pending',
    1: 'Verified',
    2: 'Rejected',
    'pending': 'Pending',
    'verified': 'Verified',
    'rejected': 'Rejected',
    'completed': 'Completed',
  };
  
  return statusMap[status] || 'Unknown';
}

/**
 * Format quest type for display
 * @param type Quest type
 * @returns Human readable quest type
 */
export function formatQuestType(type: string): string {
  const typeMap: Record<string, string> = {
    'social_media': 'Social Media',
    'on_chain': 'On-Chain',
    'community': 'Community',
    'twitter': 'Twitter',
    'discord': 'Discord',
  };
  
  return typeMap[type] || type;
}

// ============ URL Formatting ============

/**
 * Validate and format Twitter URL
 * @param url Twitter URL to validate
 * @returns Formatted URL or null if invalid
 */
export function formatTwitterUrl(url: string): string | null {
  try {
    // Remove any whitespace
    const cleanUrl = url.trim();
    
    // Check if it matches Twitter URL pattern
    const twitterPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    
    if (!twitterPattern.test(cleanUrl)) {
      return null;
    }
    
    // Ensure https
    if (cleanUrl.startsWith('http://')) {
      return cleanUrl.replace('http://', 'https://');
    }
    
    return cleanUrl;
  } catch (error) {
    console.error('Error formatting Twitter URL:', error);
    return null;
  }
}

/**
 * Extract tweet ID from Twitter URL
 * @param url Twitter URL
 * @returns Tweet ID or null if invalid
 */
export function extractTweetId(url: string): string | null {
  try {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting tweet ID:', error);
    return null;
  }
}

// ============ Error Formatting ============

/**
 * Format error message for user display
 * @param error Error object or string
 * @returns User-friendly error message
 */
export function formatError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Handle common error patterns
    if (error.message.includes('user rejected')) {
      return 'Transaction was cancelled by user';
    }
    
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection';
    }
    
    return error.message;
  }
  
  if (error?.reason) {
    return error.reason;
  }
  
  return 'An unexpected error occurred';
}

// ============ Utility Functions ============

/**
 * Clamp a number between min and max values
 * @param value Number to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if a string is a valid number
 * @param value String to check
 * @returns True if valid number
 */
export function isValidNumber(value: string): boolean {
  return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}

/**
 * Remove trailing zeros from decimal number string
 * @param value Number string
 * @returns String with trailing zeros removed
 */
export function removeTrailingZeros(value: string): string {
  if (!value.includes('.')) return value;
  
  return value.replace(/\.?0+$/, '');
}