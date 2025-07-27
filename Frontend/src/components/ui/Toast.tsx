'use client';

// ============ Imports ============
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
// Simple className concatenation utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Layout of Component:
// types
// context
// reducer
// provider
// hooks
// components

// ============ Types ============
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'CLEAR_TOASTS' };

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// ============ Toast Context ============
const ToastContext = createContext<ToastContextType | null>(null);

// ============ Toast Reducer ============
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        toasts: [...state.toasts, action.toast]
      };
    case 'REMOVE_TOAST':
      return {
        toasts: state.toasts.filter(toast => toast.id !== action.id)
      };
    case 'CLEAR_TOASTS':
      return {
        toasts: []
      };
    default:
      return state;
  }
}

// ============ Toast Provider ============
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  /**
   * Add a new toast notification
   * @param toast Toast configuration without ID
   * @returns Generated toast ID for manual removal if needed
   */
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Generate unique ID for toast
    const id = Math.random().toString(36).substring(2, 11);
    
    // Create toast with default values
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      dismissible: true, // Default dismissible
      ...toast
    };

    // Add toast to state
    dispatch({ type: 'ADD_TOAST', toast: newToast });

    // Auto remove toast after duration (except for loading toasts)
    if (toast.type !== 'loading' && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, newToast.duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast by ID
   * @param id Toast ID to remove
   */
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, []);

  return (
    <ToastContext.Provider value={{ 
      toasts: state.toasts, 
      addToast, 
      removeToast, 
      clearToasts 
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// ============ Toast Hook ============
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, clearToasts } = context;

  return {
    // Generic toast function
    toast: addToast,
    
    // Convenience functions for specific toast types
    success: (message: string, options?: Partial<Toast>) => 
      addToast({ type: 'success', message, ...options }),
    
    error: (message: string, options?: Partial<Toast>) => 
      addToast({ type: 'error', message, duration: 8000, ...options }),
    
    warning: (message: string, options?: Partial<Toast>) => 
      addToast({ type: 'warning', message, ...options }),
    
    info: (message: string, options?: Partial<Toast>) => 
      addToast({ type: 'info', message, ...options }),
    
    loading: (message: string, options?: Partial<Toast>) => 
      addToast({ type: 'loading', message, duration: 0, dismissible: false, ...options }),
    
    // Toast management functions
    removeToast,
    clearToasts
  };
}

// ============ Toast Container ============
function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts } = context;

  // Don't render container if no toasts
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}

// ============ Toast Item Component ============
interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();

  useEffect(() => {
    // Add entrance animation class when toast mounts
    const element = document.getElementById(`toast-${toast.id}`);
    if (element) {
      element.classList.add('animate-slide-in');
    }
  }, [toast.id]);

  /**
   * Handle toast removal with exit animation
   */
  const handleRemove = () => {
    const element = document.getElementById(`toast-${toast.id}`);
    if (element) {
      // Add exit animation
      element.classList.add('animate-slide-out');
      // Remove after animation completes
      setTimeout(() => {
        removeToast(toast.id);
      }, 300);
    } else {
      // Fallback if element not found
      removeToast(toast.id);
    }
  };

  /**
   * Handle action button click
   */
  const handleActionClick = () => {
    if (toast.action) {
      toast.action.onClick();
      // Auto-remove toast after action unless it's a loading toast
      if (toast.type !== 'loading') {
        handleRemove();
      }
    }
  };

  /**
   * Get toast styling based on type
   * @param type Toast type
   * @returns Styling configuration object
   */
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-600',
          iconComponent: CheckCircleIcon
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          iconComponent: XCircleIcon
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          iconComponent: ExclamationTriangleIcon
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          iconComponent: InformationCircleIcon
        };
      case 'loading':
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-600',
          iconComponent: null
        };
      default:
        return {
          container: 'bg-white border-gray-200 text-gray-800',
          icon: 'text-gray-600',
          iconComponent: InformationCircleIcon
        };
    }
  };

  const styles = getToastStyles(toast.type);
  const IconComponent = styles.iconComponent;

  return (
    <div
      id={`toast-${toast.id}`}
      className={cn(
        "relative flex items-start p-4 rounded-lg border shadow-lg transition-all duration-300",
        "backdrop-blur-sm bg-opacity-95 pointer-events-auto",
        styles.container
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {toast.type === 'loading' ? (
          <div 
            className={cn(
              "animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full", 
              styles.icon
            )} 
            aria-label="Loading"
          />
        ) : IconComponent ? (
          <IconComponent className={cn("h-5 w-5", styles.icon)} aria-hidden="true" />
        ) : null}
      </div>

      {/* Content */}
      <div className="ml-3 flex-1 min-w-0">
        {/* Title */}
        {toast.title && (
          <h4 className="text-sm font-semibold mb-1 truncate">
            {toast.title}
          </h4>
        )}
        
        {/* Message */}
        <p className="text-sm leading-5 break-words">
          {toast.message}
        </p>

        {/* Action Button */}
        {toast.action && (
          <div className="mt-3">
            <button
              onClick={handleActionClick}
              className={cn(
                "text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded",
                toast.type === 'success' && "text-green-700 focus:ring-green-500",
                toast.type === 'error' && "text-red-700 focus:ring-red-500",
                toast.type === 'warning' && "text-yellow-700 focus:ring-yellow-500",
                toast.type === 'info' && "text-blue-700 focus:ring-blue-500",
                toast.type === 'loading' && "text-gray-700 focus:ring-gray-500"
              )}
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {toast.dismissible && (
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleRemove}
            className={cn(
              "inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
              "hover:opacity-75 transition-opacity duration-200",
              toast.type === 'success' && "text-green-500 hover:text-green-600 focus:ring-green-500",
              toast.type === 'error' && "text-red-500 hover:text-red-600 focus:ring-red-500",
              toast.type === 'warning' && "text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500",
              toast.type === 'info' && "text-blue-500 hover:text-blue-600 focus:ring-blue-500",
              toast.type === 'loading' && "text-gray-500 hover:text-gray-600 focus:ring-gray-500"
            )}
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Export ============
export default ToastProvider;