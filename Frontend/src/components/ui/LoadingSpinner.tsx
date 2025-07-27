// ============ Imports ============
import { ComponentProps } from 'react';

// ============ Types ============
interface LoadingSpinnerProps extends Omit<ComponentProps<'div'>, 'children'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  variant?: 'spinner' | 'dots' | 'pulse';
}

/**
 * @title LoadingSpinner
 * @notice Reusable loading spinner component with multiple variants and sizes
 * @dev Provides consistent loading states across the application
 */
export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  variant = 'spinner',
  className = '',
  ...props 
}: LoadingSpinnerProps) {

  // ============ Size Classes ============
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  // ============ Color Classes ============
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  // ============ Spinner Variant ============
  if (variant === 'spinner') {
    return (
      <div 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        {...props}
      >
        <svg 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // ============ Dots Variant ============
  if (variant === 'dots') {
    const dotSize = {
      xs: 'h-1 w-1',
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2', 
      lg: 'h-2.5 w-2.5',
      xl: 'h-3 w-3',
    };

    return (
      <div 
        className={`flex space-x-1 ${className}`}
        {...props}
      >
        <div className={`${dotSize[size]} bg-current rounded-full animate-bounce ${colorClasses[color]}`} />
        <div className={`${dotSize[size]} bg-current rounded-full animate-bounce delay-100 ${colorClasses[color]}`} />
        <div className={`${dotSize[size]} bg-current rounded-full animate-bounce delay-200 ${colorClasses[color]}`} />
      </div>
    );
  }

  // ============ Pulse Variant ============
  return (
    <div 
      className={`${sizeClasses[size]} bg-current rounded-full animate-pulse ${colorClasses[color]} ${className}`}
      {...props}
    />
  );
}

// ============ Specialized Loading Components ============

/**
 * Full page loading overlay
 */
export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Card content loading skeleton
 */
export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

/**
 * Button loading state
 */
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}

export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText = "Loading...",
  className = "",
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <button 
      className={`flex items-center justify-center ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color="white" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Table row loading skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded"></div>
        </td>
      ))}
    </tr>
  );
}

/**
 * Loading state for lists
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}