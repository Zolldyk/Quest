'use client';

import { Suspense, ReactNode } from 'react';
import Link from 'next/link';
import { useActiveAccount } from 'thirdweb/react';
import WalletConnectionV5 from '../wallet/WalletConnectionV5';
import { SkeletonLoader } from '../ui/SkeletonLoader';

interface OptimizedLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  showWalletPrompt?: boolean;
}

// Fast-loading navigation component
function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Quest DApp
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/quests"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Quests
                </Link>
                <Link
                  href="/staking"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Staking
                </Link>
              </div>
            </div>
          </div>
          <Suspense fallback={<SkeletonLoader variant="button" />}>
            <WalletConnectionV5 variant="compact" />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

// Wallet connection prompt component
function WalletPrompt() {
  const account = useActiveAccount();
  
  if (account) return null;
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              Connect your wallet to access all features
            </span>
          </div>
          <WalletConnectionV5 variant="compact" />
        </div>
      </div>
    </div>
  );
}

// Page header component
function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-gray-600 max-w-3xl">
          {description}
        </p>
      )}
    </div>
  );
}

// Main optimized layout component
export default function OptimizedLayout({ 
  children, 
  title, 
  description, 
  showWalletPrompt = true 
}: OptimizedLayoutProps) {
  return (
    <>
      <Navigation />
      {showWalletPrompt && <WalletPrompt />}
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader title={title} description={description} />
          
          {/* Content with error boundary */}
          <Suspense fallback={
            <div className="space-y-6">
              <SkeletonLoader variant="card" count={3} />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>Quest DApp - Powered by Etherlink</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-gray-700">Documentation</a>
              <a href="#" className="hover:text-gray-700">Discord</a>
              <a href="#" className="hover:text-gray-700">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}