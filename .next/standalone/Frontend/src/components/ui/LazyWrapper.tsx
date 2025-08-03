'use client';

import { Suspense, ComponentType, ReactNode } from 'react';
import { SkeletonLoader } from './SkeletonLoader';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

// Generic lazy wrapper component
export function LazyWrapper({ children, fallback, className }: LazyWrapperProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback || <SkeletonLoader variant="card" />}>
        {children}
      </Suspense>
    </div>
  );
}

// HOC for creating lazy-loaded components with custom fallbacks
export function withLazyLoading<T extends ComponentType<any>>(
  Component: T,
  fallback?: ReactNode
) {
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <SkeletonLoader variant="card" />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Progressive loading component for heavy blockchain components
interface ProgressiveLoaderProps {
  children: ReactNode;
  delay?: number;
  fallback?: ReactNode;
}

export function ProgressiveLoader({ 
  children, 
  delay = 100, 
  fallback 
}: ProgressiveLoaderProps) {
  return (
    <Suspense fallback={
      <div className="animate-pulse">
        {fallback || <SkeletonLoader variant="card" />}
      </div>
    }>
      <div style={{ animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </Suspense>
  );
}

export default LazyWrapper;