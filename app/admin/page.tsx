'use client';

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  HomeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Import components from Frontend directory
import AdminPanel from '../../Frontend/src/components/admin/AdminPanel';
import PendingSubmissions from '../../Frontend/src/components/admin/PendingSubmissions';
import QuestManagement from '../../Frontend/src/components/admin/QuestManagement';
import PoolStats from '../../Frontend/src/components/stats/PoolStats';
import WalletConnectionV5 from '../../Frontend/src/components/wallet/WalletConnectionV5';
import { useAddress } from '../../Frontend/src/hooks/useThirdwebV5';

// Admin addresses - should be set via environment variables
const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase().trim(),
  // Add more admin addresses here
].filter(Boolean);

export default function AdminPage() {
  // ============ Hooks ============
  const address = useAddress();

  // ============ State ============
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'management'>('overview');

  // ============ Functions ============
  const checkAdminAccess = useCallback(async () => {
    setIsCheckingAccess(true);

    try {
      if (!address) {
        setIsAdmin(false);
        setIsCheckingAccess(false);
        return;
      }

      // Check if address is in hardcoded admin list first (most reliable)
      const isHardcodedAdmin = ADMIN_ADDRESSES.includes(address.toLowerCase().trim());

      if (isHardcodedAdmin) {
        console.log('Admin access granted via hardcoded list');
        setIsAdmin(true);
        setIsCheckingAccess(false);
        return;
      }

      // If not in hardcoded list, set as false for now
      // We can add on-chain checking later if needed
      console.log('Address not in admin list:', address);
      setIsAdmin(false);
    } catch (err) {
      console.error('Error checking admin access:', err);
      setIsAdmin(false);
    } finally {
      setIsCheckingAccess(false);
    }
  }, [address]); // Removed questManager dependency to prevent infinite loops

  // ============ Effects ============
  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  // ============ Handlers ============
  const handleTabSwitch = (tab: 'overview' | 'submissions' | 'management') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Cog6ToothIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Quest Admin</h1>
                  <p className="text-xs text-gray-500 -mt-1">Management Panel</p>
                </div>
              </Link>

              {/* Quick Nav */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                  <HomeIcon className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/quests" className="text-gray-600 hover:text-gray-900">
                  Quests
                </Link>
              </nav>
            </div>

            {/* Wallet Connection */}
            <WalletConnectionV5 variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-lg text-gray-600">
              Manage quests, verify submissions, and monitor system health
            </p>
          </div>

          {/* Connection Check */}
          {!address ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Authentication Required
                </h2>
                <p className="text-gray-600 mb-6">
                  Connect your wallet to access the admin panel
                </p>
                <WalletConnectionV5 variant="default" />
              </div>
            </div>
          ) : isCheckingAccess ? (
            /* Loading State */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Verifying Access
                </h2>
                <p className="text-gray-600">
                  Checking your admin privileges...
                </p>
              </div>
            </div>
          ) : !isAdmin ? (
            /* Access Denied */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Access Denied
                </h2>
                <p className="text-gray-600 mb-4">
                  Your wallet address ({address?.slice(0, 6)}...{address?.slice(-4)}) does not have admin privileges.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  If you believe this is an error, please contact the system administrator.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Admin access requires the NEXT_PUBLIC_ADMIN_ADDRESS environment variable to be set to your wallet address.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Admin Interface */
            <>
              {/* Admin Status Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Admin Access Granted
                    </h3>
                    <p className="text-sm text-green-700">
                      Connected as admin: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="mb-8">
                <div className="sm:hidden">
                  <select
                    value={activeTab}
                    onChange={(e) => handleTabSwitch(e.target.value as any)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="overview">Overview</option>
                    <option value="submissions">Pending Submissions</option>
                    <option value="management">Quest Management</option>
                  </select>
                </div>
                <div className="hidden sm:block">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => handleTabSwitch('overview')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => handleTabSwitch('submissions')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'submissions'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Pending Submissions
                      </button>
                      <button
                        onClick={() => handleTabSwitch('management')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'management'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Quest Management
                      </button>
                    </nav>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-8">
                {activeTab === 'overview' && (
                  <>
                    {/* System Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                          <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                              System Overview
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                              Key metrics and system status
                            </p>
                          </div>
                          <div className="p-6">
                            <AdminPanel />
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                          <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                              Pool Statistics
                            </h2>
                          </div>
                          <div className="p-6">
                            <PoolStats />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'submissions' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Pending Submissions
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Review and verify quest submissions
                      </p>
                    </div>
                    <div className="p-6">
                      <PendingSubmissions />
                    </div>
                  </div>
                )}

                {activeTab === 'management' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Quest Management
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure quest parameters and settings
                      </p>
                    </div>
                    <div className="p-6">
                      <QuestManagement />
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Actions */}
              <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">
                  ⚠️ Emergency Actions
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  These actions should only be used in emergency situations and will affect all users.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to pause all quest submissions? This will prevent new submissions until resumed.')) {
                        console.log('Pausing submissions...');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Pause Submissions
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to enable emergency withdrawal? This will allow all users to withdraw their stakes immediately.')) {
                        console.log('Enabling emergency withdrawal...');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Emergency Withdrawal
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}