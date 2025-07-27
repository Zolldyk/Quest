// ============ Imports ============
import { VALIDATION, TOKEN_LIMITS, SOCIAL_CONFIG, TOKENS } from './constants';

// ============ Types ============
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: Record<string, any>;
}

// ============ Basic Validation Functions ============

/**
 * Validate if a string is not empty after trimming
 * @param value String to validate
 * @param fieldName Name of the field for error message
 * @returns Validation result
 */
export function validateRequired(value: string | undefined | null, fieldName: string = 'Field'): ValidationResult {
  const trimmed = (value || '').trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }
  
  return {
    isValid: true,
    sanitized: trimmed
  };
}

/**
 * Validate string length
 * @param value String to validate
 * @param minLength Minimum length
 * @param maxLength Maximum length
 * @param fieldName Name of the field for error message
 * @returns Validation result
 */
export function validateLength(
  value: string,
  minLength: number = 0,
  maxLength: number = Infinity,
  fieldName: string = 'Field'
): ValidationResult {
  const length = value.length;
  
  if (length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters long`
    };
  }
  
  if (length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${maxLength} characters long`
    };
  }
  
  return {
    isValid: true,
    sanitized: value
  };
}

/**
 * Validate using regex pattern
 * @param value String to validate
 * @param pattern Regex pattern
 * @param errorMessage Error message if validation fails
 * @returns Validation result
 */
export function validatePattern(value: string, pattern: RegExp, errorMessage: string): ValidationResult {
  if (!pattern.test(value)) {
    return {
      isValid: false,
      error: errorMessage
    };
  }
  
  return {
    isValid: true,
    sanitized: value
  };
}

// ============ Wallet Address Validation ============

/**
 * Validate Ethereum wallet address
 * @param address Address to validate
 * @returns Validation result
 */
export function validateWalletAddress(address: string): ValidationResult {
  const requiredCheck = validateRequired(address, 'Wallet address');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const trimmed = address.trim();
  
  // Check if it matches Ethereum address pattern
  if (!VALIDATION.WALLET_ADDRESS.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid wallet address format'
    };
  }
  
  // Convert to checksum format
  const checksumAddress = trimmed.toLowerCase();
  
  return {
    isValid: true,
    sanitized: checksumAddress
  };
}

/**
 * Validate if address is not zero address
 * @param address Address to validate
 * @returns Validation result
 */
export function validateNonZeroAddress(address: string): ValidationResult {
  const addressCheck = validateWalletAddress(address);
  if (!addressCheck.isValid) return addressCheck;
  
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  
  if (address.toLowerCase() === zeroAddress) {
    return {
      isValid: false,
      error: 'Cannot use zero address'
    };
  }
  
  return {
    isValid: true,
    sanitized: addressCheck.sanitized
  };
}

// ============ Token Amount Validation ============

/**
 * Validate token amount
 * @param amount Amount to validate
 * @param tokenSymbol Token symbol for validation rules
 * @param allowZero Whether to allow zero amounts
 * @returns Validation result
 */
export function validateTokenAmount(
  amount: string | number,
  tokenSymbol: keyof typeof TOKENS = 'USDC',
  allowZero: boolean = false
): ValidationResult {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  
  const requiredCheck = validateRequired(amountStr, 'Amount');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const trimmed = amountStr.trim();
  
  // Check if it's a valid number format
  if (!VALIDATION.AMOUNT.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid amount format'
    };
  }
  
  const numAmount = parseFloat(trimmed);
  
  // Check if it's a valid number
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return {
      isValid: false,
      error: 'Invalid amount'
    };
  }
  
  // Check for negative amounts
  if (numAmount < 0) {
    return {
      isValid: false,
      error: 'Amount cannot be negative'
    };
  }
  
  // Check for zero amounts
  if (!allowZero && numAmount === 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than zero'
    };
  }
  
  // Check decimal places based on token
  const token = TOKENS[tokenSymbol];
  const decimalPlaces = (trimmed.split('.')[1] || '').length;
  
  if (decimalPlaces > token.DECIMALS) {
    return {
      isValid: false,
      error: `Amount cannot have more than ${token.DECIMALS} decimal places`
    };
  }
  
  return {
    isValid: true,
    sanitized: trimmed
  };
}

/**
 * Validate staking amount with min/max limits
 * @param amount Amount to validate
 * @returns Validation result
 */
export function validateStakeAmount(amount: string | number): ValidationResult {
  const amountCheck = validateTokenAmount(amount, 'USDC');
  if (!amountCheck.isValid) return amountCheck;
  
  const numAmount = parseFloat(amountCheck.sanitized!);
  const minStake = parseFloat(TOKEN_LIMITS.MIN_STAKE_AMOUNT);
  const maxStake = parseFloat(TOKEN_LIMITS.MAX_STAKE_AMOUNT);
  
  if (numAmount < minStake) {
    return {
      isValid: false,
      error: `Minimum stake amount is ${TOKEN_LIMITS.MIN_STAKE_AMOUNT} USDC`
    };
  }
  
  if (numAmount > maxStake) {
    return {
      isValid: false,
      error: `Maximum stake amount is ${TOKEN_LIMITS.MAX_STAKE_AMOUNT} USDC`
    };
  }
  
  return {
    isValid: true,
    sanitized: amountCheck.sanitized
  };
}

/**
 * Validate user balance for transaction
 * @param amount Amount to validate
 * @param balance User's current balance
 * @param tokenSymbol Token symbol
 * @returns Validation result
 */
export function validateSufficientBalance(
  amount: string | number,
  balance: string | number,
  tokenSymbol: keyof typeof TOKENS = 'USDC'
): ValidationResult {
  const amountCheck = validateTokenAmount(amount, tokenSymbol);
  if (!amountCheck.isValid) return amountCheck;
  
  const numAmount = parseFloat(amountCheck.sanitized!);
  const numBalance = typeof balance === 'number' ? balance : parseFloat(balance);
  
  if (numAmount > numBalance) {
    return {
      isValid: false,
      error: `Insufficient balance. You have ${numBalance} ${TOKENS[tokenSymbol].SYMBOL}`
    };
  }
  
  return {
    isValid: true,
    sanitized: amountCheck.sanitized
  };
}

// ============ URL Validation ============

/**
 * Validate Twitter URL
 * @param url URL to validate
 * @returns Validation result
 */
export function validateTwitterUrl(url: string): ValidationResult {
  const requiredCheck = validateRequired(url, 'Twitter URL');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const trimmed = url.trim();
  
  // Check length
  const lengthCheck = validateLength(trimmed, 1, VALIDATION.MAX_LENGTHS.TWEET_URL, 'Twitter URL');
  if (!lengthCheck.isValid) return lengthCheck;
  
  // Check if it's a valid URL format
  let urlObj: URL;
  try {
    urlObj = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
  
  // Check if it matches Twitter/X domain patterns
  const isValidTwitterUrl = SOCIAL_CONFIG.TWITTER.URL_PATTERNS.some(pattern => 
    pattern.test(trimmed)
  );
  
  if (!isValidTwitterUrl) {
    return {
      isValid: false,
      error: 'URL must be a valid Twitter or X.com status URL'
    };
  }
  
  // Extract tweet ID to ensure it exists
  const tweetIdMatch = trimmed.match(/\/status\/(\d+)/);
  if (!tweetIdMatch || !tweetIdMatch[1]) {
    return {
      isValid: false,
      error: 'Invalid Twitter status URL'
    };
  }
  
  // Normalize URL to https
  const normalizedUrl = trimmed.replace(/^http:/, 'https:');
  
  return {
    isValid: true,
    sanitized: normalizedUrl
  };
}

/**
 * Validate general URL format
 * @param url URL to validate
 * @returns Validation result
 */
export function validateUrl(url: string): ValidationResult {
  const requiredCheck = validateRequired(url, 'URL');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const trimmed = url.trim();
  
  try {
    new URL(trimmed);
    return {
      isValid: true,
      sanitized: trimmed
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

// ============ Quest Validation ============

/**
 * Validate quest submission data
 * @param questData Quest submission data
 * @returns Form validation result
 */
export function validateQuestSubmission(questData: {
  tweetUrl?: string;
  questType?: string;
  userAddress?: string;
}): FormValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  
  // Validate tweet URL
  if (questData.tweetUrl) {
    const tweetUrlCheck = validateTwitterUrl(questData.tweetUrl);
    if (!tweetUrlCheck.isValid) {
      errors.tweetUrl = tweetUrlCheck.error!;
    } else {
      sanitizedData.tweetUrl = tweetUrlCheck.sanitized;
    }
  } else {
    errors.tweetUrl = 'Twitter URL is required';
  }
  
  // Validate user address
  if (questData.userAddress) {
    const addressCheck = validateWalletAddress(questData.userAddress);
    if (!addressCheck.isValid) {
      errors.userAddress = addressCheck.error!;
    } else {
      sanitizedData.userAddress = addressCheck.sanitized;
    }
  } else {
    errors.userAddress = 'Wallet address is required';
  }
  
  // Validate quest type
  if (questData.questType) {
    const validQuestTypes = Object.values(SOCIAL_CONFIG.TWITTER);
    if (!validQuestTypes.includes(questData.questType as any)) {
      errors.questType = 'Invalid quest type';
    } else {
      sanitizedData.questType = questData.questType;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: Object.keys(errors).length === 0 ? sanitizedData : undefined
  };
}

/**
 * Validate quest content for specific requirements
 * @param tweetUrl Twitter URL to validate
 * @returns Validation result with specific quest requirements
 */
export function validateQuestContent(tweetUrl: string): ValidationResult {
  const urlCheck = validateTwitterUrl(tweetUrl);
  if (!urlCheck.isValid) return urlCheck;
  
  // In a real implementation, you would fetch the tweet content
  // and validate it contains the required hashtag and mentions
  // For MVP, we'll just validate the URL format
  
  const url = urlCheck.sanitized!;
  
  // Additional quest-specific validations could go here
  // For example, checking if the tweet contains required hashtags
  
  return {
    isValid: true,
    sanitized: url
  };
}

// ============ Form Validation ============

/**
 * Validate staking form data
 * @param formData Staking form data
 * @returns Form validation result
 */
export function validateStakingForm(formData: {
  amount?: string;
  userAddress?: string;
  balance?: string;
}): FormValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  
  // Validate amount
  if (formData.amount) {
    const stakeCheck = validateStakeAmount(formData.amount);
    if (!stakeCheck.isValid) {
      errors.amount = stakeCheck.error!;
    } else {
      sanitizedData.amount = stakeCheck.sanitized;
      
      // Check sufficient balance if provided
      if (formData.balance) {
        const balanceCheck = validateSufficientBalance(
          stakeCheck.sanitized!,
          formData.balance,
          'USDC'
        );
        if (!balanceCheck.isValid) {
          errors.amount = balanceCheck.error!;
        }
      }
    }
  } else {
    errors.amount = 'Amount is required';
  }
  
  // Validate user address
  if (formData.userAddress) {
    const addressCheck = validateNonZeroAddress(formData.userAddress);
    if (!addressCheck.isValid) {
      errors.userAddress = addressCheck.error!;
    } else {
      sanitizedData.userAddress = addressCheck.sanitized;
    }
  } else {
    errors.userAddress = 'Wallet address is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: Object.keys(errors).length === 0 ? sanitizedData : undefined
  };
}

/**
 * Validate admin form data
 * @param formData Admin form data
 * @returns Form validation result
 */
export function validateAdminForm(formData: {
  questId?: string;
  userAddress?: string;
  status?: string;
  reason?: string;
}): FormValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  
  // Validate quest ID
  if (formData.questId) {
    const requiredCheck = validateRequired(formData.questId, 'Quest ID');
    if (!requiredCheck.isValid) {
      errors.questId = requiredCheck.error!;
    } else {
      sanitizedData.questId = requiredCheck.sanitized;
    }
  } else {
    errors.questId = 'Quest ID is required';
  }
  
  // Validate user address
  if (formData.userAddress) {
    const addressCheck = validateWalletAddress(formData.userAddress);
    if (!addressCheck.isValid) {
      errors.userAddress = addressCheck.error!;
    } else {
      sanitizedData.userAddress = addressCheck.sanitized;
    }
  } else {
    errors.userAddress = 'User address is required';
  }
  
  // Validate status
  if (formData.status) {
    const validStatuses = ['verified', 'rejected', 'pending'];
    if (!validStatuses.includes(formData.status)) {
      errors.status = 'Invalid status';
    } else {
      sanitizedData.status = formData.status;
    }
  } else {
    errors.status = 'Status is required';
  }
  
  // Validate reason if status is rejected
  if (formData.status === 'rejected') {
    if (!formData.reason || !formData.reason.trim()) {
      errors.reason = 'Reason is required when rejecting a quest';
    } else {
      const lengthCheck = validateLength(
        formData.reason.trim(),
        10,
        VALIDATION.MAX_LENGTHS.USER_INPUT,
        'Reason'
      );
      if (!lengthCheck.isValid) {
        errors.reason = lengthCheck.error!;
      } else {
        sanitizedData.reason = lengthCheck.sanitized;
      }
    }
  } else if (formData.reason) {
    // Optional reason for other statuses
    const lengthCheck = validateLength(
      formData.reason.trim(),
      0,
      VALIDATION.MAX_LENGTHS.USER_INPUT,
      'Reason'
    );
    if (!lengthCheck.isValid) {
      errors.reason = lengthCheck.error!;
    } else {
      sanitizedData.reason = lengthCheck.sanitized;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: Object.keys(errors).length === 0 ? sanitizedData : undefined
  };
}

// ============ Utility Validation Functions ============

/**
 * Sanitize user input by removing potentially harmful characters
 * @param input Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potential HTML/script injection characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate and sanitize multiple fields at once
 * @param fields Object with field names and values
 * @param validators Object with field names and validator functions
 * @returns Combined validation result
 */
export function validateFields(
  fields: Record<string, any>,
  validators: Record<string, (value: any) => ValidationResult>
): FormValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const result = validator(value);
      if (!result.isValid) {
        errors[fieldName] = result.error!;
      } else if (result.sanitized !== undefined) {
        sanitizedData[fieldName] = result.sanitized;
      }
    } else {
      // No validator specified, just pass through
      sanitizedData[fieldName] = value;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: Object.keys(errors).length === 0 ? sanitizedData : undefined
  };
}

/**
 * Check if a value is empty (null, undefined, empty string, or whitespace)
 * @param value Value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate that at least one field in a group is filled
 * @param fields Object with field values
 * @param fieldNames Array of field names that form the group
 * @param groupName Name of the group for error message
 * @returns Validation result
 */
export function validateAtLeastOne(
  fields: Record<string, any>,
  fieldNames: string[],
  groupName: string = 'fields'
): ValidationResult {
  const hasValue = fieldNames.some(fieldName => !isEmpty(fields[fieldName]));
  
  if (!hasValue) {
    return {
      isValid: false,
      error: `At least one ${groupName} must be provided`
    };
  }
  
  return {
    isValid: true
  };
}

/**
 * Create a debounced validation function
 * @param validator Validation function
 * @param delay Delay in milliseconds
 * @returns Debounced validation function
 */
export function createDebouncedValidator<T>(
  validator: (value: T) => ValidationResult,
  delay: number = 300
): (value: T, callback: (result: ValidationResult) => void) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
}