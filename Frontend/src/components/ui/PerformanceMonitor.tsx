'use client';

import { useEffect } from 'react';

interface PerformanceMonitorProps {
  pageName: string;
}

export function PerformanceMonitor({ pageName }: PerformanceMonitorProps) {
  useEffect(() => {
    // Monitor Core Web Vitals and other performance metrics
    const measurePerformance = () => {
      if (typeof window === 'undefined') return;

      // Measure page load time
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
          
          console.log(`[Performance] ${pageName}:`, {
            pageLoad: `${pageLoadTime.toFixed(2)}ms`,
            domReady: `${domContentLoaded.toFixed(2)}ms`,
            fcp: firstContentfulPaint ? `${firstContentfulPaint.toFixed(2)}ms` : 'N/A'
          });
        }
      }

      // Monitor memory usage (Chrome only)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log(`[Memory] ${pageName}:`, {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        });
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Monitor Core Web Vitals using Web Vitals API
    if ('web-vital' in window || typeof (window as any).webVitals !== 'undefined') {
      // This would be implemented with web-vitals library in production
      // For now, we'll just log basic metrics
    }

    // Monitor long tasks (if supported)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) {
              console.warn(`[Long Task] ${pageName}: ${entry.duration.toFixed(2)}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        return () => {
          observer.disconnect();
        };
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, [pageName]);

  // Component doesn't render anything
  return null;
}

// Hook for measuring component render times
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Flag renders longer than 1 frame (60fps)
        console.warn(`[Slow Render] ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
}

// Utility to measure async operations
export function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  
  return operation().finally(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`[Async Operation] ${operationName}: ${duration.toFixed(2)}ms`);
  });
}

export default PerformanceMonitor;