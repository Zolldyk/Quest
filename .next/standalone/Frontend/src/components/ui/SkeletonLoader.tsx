'use client';

import { cn } from '../../utils/cn';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'button' | 'avatar' | 'table';
  count?: number;
  height?: string;
  width?: string;
}

export function SkeletonLoader({ 
  className, 
  variant = 'default', 
  count = 1, 
  height, 
  width 
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  const variantClasses = {
    default: "h-4 w-full",
    card: "h-32 w-full",
    text: "h-4 w-3/4",
    button: "h-10 w-24",
    avatar: "h-10 w-10 rounded-full",
    table: "h-8 w-full"
  };

  const skeletonClass = cn(
    baseClasses,
    variantClasses[variant],
    className
  );

  const style = {
    ...(height && { height }),
    ...(width && { width })
  };

  if (count === 1) {
    return <div className={skeletonClass} style={style} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={style} />
      ))}
    </div>
  );
}

// Specific skeleton components for common UI patterns
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <SkeletonLoader variant="text" className="mb-2" />
            <SkeletonLoader height="2rem" className="mb-1" />
            <SkeletonLoader variant="text" width="60%" />
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <SkeletonLoader height="1.5rem" width="40%" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} variant="table" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StakingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Staking interface skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SkeletonLoader height="1.5rem" width="30%" className="mb-4" />
        <div className="space-y-4">
          <div>
            <SkeletonLoader variant="text" width="20%" className="mb-2" />
            <SkeletonLoader height="3rem" />
          </div>
          <div className="flex gap-3">
            <SkeletonLoader variant="button" className="flex-1" />
            <SkeletonLoader variant="button" className="flex-1" />
          </div>
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SkeletonLoader height="1.5rem" width="40%" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonLoader variant="text" width="30%" />
              <SkeletonLoader variant="text" width="20%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuestsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quest card skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SkeletonLoader height="1.5rem" width="40%" className="mb-4" />
        <SkeletonLoader count={3} className="mb-4" />
        <div className="flex justify-between items-center">
          <SkeletonLoader variant="text" width="25%" />
          <SkeletonLoader variant="button" />
        </div>
      </div>
      
      {/* Instructions skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SkeletonLoader height="1.5rem" width="30%" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <SkeletonLoader variant="avatar" className="w-6 h-6 rounded-full" />
              <SkeletonLoader variant="text" className="flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NFTGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <SkeletonLoader variant="card" className="mb-4" />
          <SkeletonLoader variant="text" className="mb-2" />
          <SkeletonLoader variant="text" width="60%" />
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;