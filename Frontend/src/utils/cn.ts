// ============ Class Name Utility ============

/**
 * @title cn (Class Names)
 * @notice Utility function for conditionally joining class names
 * @dev Simple implementation for combining Tailwind classes without conflicts
 */

type ClassValue = string | number | boolean | undefined | null | ClassArray | ClassDictionary;
type ClassArray = ClassValue[];
type ClassDictionary = Record<string, any>;

/**
 * Combine and filter class names
 * @param classes Array of class values to combine
 * @returns Combined class string
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];
  
  for (const cls of classes) {
    if (!cls) continue;
    
    if (typeof cls === 'string') {
      result.push(cls);
    } else if (typeof cls === 'number') {
      result.push(cls.toString());
    } else if (Array.isArray(cls)) {
      const inner = cn(...cls);
      if (inner) result.push(inner);
    } else if (typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) result.push(key);
      }
    }
  }
  
  return result.join(' ').trim();
}

export default cn;