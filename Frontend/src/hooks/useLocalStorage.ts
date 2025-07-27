// ============ Imports ============
import { useState, useEffect, useCallback, useRef } from 'react';

// ============ Types ============
type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageOptions {
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  syncAcrossTabs?: boolean;
}

// ============ Constants ============
const DEFAULT_OPTIONS: UseLocalStorageOptions = {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  syncAcrossTabs: true
};

/**
 * @title useLocalStorage
 * @notice Custom hook for managing localStorage with TypeScript support and cross-tab synchronization
 * @dev Provides safe localStorage operations with SSR compatibility and error handling
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: SetValue<T>) => void, () => void] {
  // ============ Configuration ============
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { serialize, deserialize, syncAcrossTabs } = opts;

  // ============ State Management ============
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Return initial value during SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or return initialValue
      return item ? deserialize!(item) : initialValue;
    } catch (error) {
      // If error, return initial value
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // ============ Refs for Optimization ============
  const initialValueRef = useRef(initialValue);
  const keyRef = useRef(key);

  // ============ Storage Operations ============
  /**
   * Set value in localStorage and update state
   * @param value New value or function to update value
   */
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function for functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update state
      setStoredValue(valueToStore);

      // Save to localStorage if available
      if (typeof window !== 'undefined') {
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serialize!(valueToStore));
        }

        // Dispatch storage event for cross-tab sync
        if (syncAcrossTabs) {
          window.dispatchEvent(new StorageEvent('storage', {
            key,
            newValue: valueToStore === undefined ? null : serialize!(valueToStore),
            oldValue: serialize!(storedValue),
            storageArea: window.localStorage,
            url: window.location.href
          }));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize, syncAcrossTabs]);

  /**
   * Remove value from localStorage and reset to initial value
   */
  const removeValue = useCallback(() => {
    try {
      // Reset to initial value
      setStoredValue(initialValueRef.current);

      // Remove from localStorage if available
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);

        // Dispatch storage event for cross-tab sync
        if (syncAcrossTabs) {
          window.dispatchEvent(new StorageEvent('storage', {
            key,
            newValue: null,
            oldValue: serialize!(storedValue),
            storageArea: window.localStorage,
            url: window.location.href
          }));
        }
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize, syncAcrossTabs]);

  // ============ Cross-Tab Synchronization ============
  useEffect(() => {
    // Skip if not in browser or sync disabled
    if (typeof window === 'undefined' || !syncAcrossTabs) {
      return;
    }

    /**
     * Handle storage events from other tabs
     * @param e Storage event
     */
    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to changes for our key
      if (e.key !== key || e.storageArea !== window.localStorage) {
        return;
      }

      try {
        // Update state based on new value
        if (e.newValue === null) {
          // Key was removed
          setStoredValue(initialValueRef.current);
        } else {
          // Key was updated
          const newValue = deserialize!(e.newValue);
          setStoredValue(newValue);
        }
      } catch (error) {
        console.warn(`Error parsing storage event for key "${key}":`, error);
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserialize, syncAcrossTabs]);

  // ============ Key Change Handling ============
  useEffect(() => {
    // If key changes, load new value from storage
    if (keyRef.current !== key) {
      keyRef.current = key;

      if (typeof window !== 'undefined') {
        try {
          const item = window.localStorage.getItem(key);
          const newValue = item ? deserialize!(item) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error reading localStorage key "${key}" after key change:`, error);
          setStoredValue(initialValue);
        }
      }
    }
  }, [key, initialValue, deserialize]);

  // ============ Initial Value Change Handling ============
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // ============ Return Hook Interface ============
  return [storedValue, setValue, removeValue];
}

// ============ Utility Hooks ============

/**
 * @title useSessionStorage
 * @notice Hook for sessionStorage with same API as useLocalStorage
 * @dev Similar to useLocalStorage but uses sessionStorage instead
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions, 'syncAcrossTabs'> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { serialize, deserialize } = opts;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? deserialize!(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: SetValue<T>) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        if (valueToStore === undefined) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, serialize!(valueToStore));
        }
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * @title useLocalStorageValue
 * @notice Lightweight hook to just read a localStorage value without state management
 * @dev Useful for one-time reads or when you don't need reactivity
 */
export function useLocalStorageValue<T>(
  key: string,
  defaultValue: T,
  options: Pick<UseLocalStorageOptions, 'deserialize'> = {}
): T {
  const { deserialize = JSON.parse } = options;

  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? deserialize(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * @title useStorageQuota
 * @notice Hook to check localStorage usage and quota
 * @dev Useful for monitoring storage usage in the app
 */
export function useStorageQuota() {
  const [quota, setQuota] = useState<{
    used: number;
    available: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.storage?.estimate) {
      return;
    }

    navigator.storage.estimate().then((estimate) => {
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = available > 0 ? (used / available) * 100 : 0;

      setQuota({
        used,
        available,
        percentage
      });
    }).catch((error) => {
      console.warn('Error getting storage estimate:', error);
    });
  }, []);

  return quota;
}