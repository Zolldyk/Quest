// ============ Imports ============
import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminPanel from '../components/admin/AdminPanel';
import PendingSubmissions from '../components/admin/PendingSubmissions';
import QuestManagement from '../components/admin/QuestManagement';
import PoolStats from '../components/stats/PoolStats';
import { WalletProtected } from '../components/wallet/WalletConnection';
import { useAuth } from '../hooks/useAuth';
import { useContracts } from '../hooks/useContracts';
import { useToast } from '../components/ui/Toast';

// ============ Constants ============
// In production, this should be managed via smart contract or environment variables
const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase(),
  // Add more admin addresses here
].filter(Boolean);

// ============ Admin Page Component ============
/**
 * @title Admin Page
 * @notice Administrative interface for managing quests and verifying submissions
 * @dev Restricted access for authorized admin addresses only
 */
const AdminPage: NextPage = () => {
  // ============ Hooks ============
  const { isConnected, address } = useAuth();
  const { questManager } = useContracts();
  const { error } = useToast();

  // ============ State ============
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'management'>('overview');

  // ============ Functions ============
  /**
   * Check if connected address has admin privileges
   */
  const checkAdminAccess = useCallback(async () => {
    setIsCheckingAccess(true);

    try {
      if (!address) {
        setIsAdmin(false);
        setIsCheckingAccess(false);
        return;
      }

      // Check if address is in hardcoded admin list
      const isHardcodedAdmin = ADMIN_ADDRESSES.includes(address.toLowerCase());

      if (isHardcodedAdmin) {
        setIsAdmin(true);
        setIsCheckingAccess(false);
        return;
      }

      // Check on-chain admin status if contract is available
      if (questManager.contract) {
        try {
          const isContractAdmin = await questManager.checkIsAdmin(address);
          setIsAdmin(isContractAdmin);
        } catch (err) {
          console.error('Error checking contract admin status:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      setIsAdmin(false);
      error('Failed to verify admin access');
    } finally {
      setIsCheckingAccess(false);
    }
  }, [address, questManager, error]);

  // ============ Effects ============
  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  /**
   * Handle tab switching
   * @param tab Target tab to switch to
   */
  const handleTabSwitch = (tab: 'overview' | 'submissions' | 'management') => {
    setActiveTab(tab);
  };

  return (
    <>
      <Head>
        <title>Admin Panel - Quest</title>
        <meta 
          name="description" 
          content="Administrative interface for managing quests and verifying submissions" 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-lg text-gray-600">
              Manage quests, verify submissions, and monitor system health
            </p>
          </div>

          {/* Connection Check */}
          {!isConnected ? (
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
                <WalletProtected>Connected</WalletProtected>
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
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Access Denied
                </h2>
                <p className="text-gray-600 mb-4">
                  Your wallet address ({address?.slice(0, 6)}...{address?.slice(-4)}) does not have admin privileges.
                </p>
                <p className="text-sm text-gray-500">
                  If you believe this is an error, please contact the system administrator.
                </p>
              </div>
            </div>
          ) : (
            /* Admin Interface */
            <>
              {/* Admin Status Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
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
                        // Pause submissions logic
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
                        // Emergency withdrawal logic
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
      </div>
    </>
  );
};

export default AdminPage;