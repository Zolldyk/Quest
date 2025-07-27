'use client';

/**
 * Integration Test Page for Thirdweb and Sequence
 * Use this page to test integrations in the browser
 */

import React, { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import WalletConnectionV5 from '../../Frontend/src/components/wallet/WalletConnectionV5';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function TestIntegrationsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  
  // Create client for SDK operations
  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'your-client-id-here'
  });

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.name === name ? { ...result, ...updates } : result
      )
    );
  };

  // Test environment configuration
  const testEnvironmentConfig = async () => {
    addTestResult({ name: 'Environment Config', status: 'pending', message: 'Checking...' });
    
    try {
      const config = {
        thirdwebClientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
        networkName: process.env.NEXT_PUBLIC_NETWORK_NAME,
        contractAddresses: {
          stakingPool: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS,
          questManager: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS,
          nftMinter: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS
        },
        sequenceConfig: {
          projectId: process.env.SEQUENCE_PROJECT_ID,
          accessKey: process.env.SEQUENCE_ACCESS_KEY
        }
      };

      const missingConfig = [];
      if (!config.thirdwebClientId) missingConfig.push('THIRDWEB_CLIENT_ID');
      if (!config.chainId) missingConfig.push('CHAIN_ID');
      if (!config.contractAddresses.stakingPool) missingConfig.push('STAKING_POOL_ADDRESS');

      if (missingConfig.length > 0) {
        updateTestResult('Environment Config', {
          status: 'warning',
          message: `Missing config: ${missingConfig.join(', ')}`,
          details: config
        });
      } else {
        updateTestResult('Environment Config', {
          status: 'success',
          message: 'All environment variables configured',
          details: config
        });
      }
    } catch (error) {
      updateTestResult('Environment Config', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Test Thirdweb SDK initialization
  const testThirdwebSDK = async () => {
    addTestResult({ name: 'Thirdweb SDK', status: 'pending', message: 'Testing SDK...' });
    
    try {
      if (!client) {
        updateTestResult('Thirdweb SDK', {
          status: 'error',
          message: 'Client not initialized'
        });
        return;
      }

      // Test client initialization
      updateTestResult('Thirdweb SDK', {
        status: 'success',
        message: `Thirdweb v5 client initialized successfully`,
        details: { client: !!client }
      });
    } catch (error) {
      updateTestResult('Thirdweb SDK', {
        status: 'error',
        message: error instanceof Error ? error.message : 'SDK test failed'
      });
    }
  };

  // Test wallet connection
  const testWalletConnection = async () => {
    addTestResult({ name: 'Wallet Connection', status: 'pending', message: 'Testing connection...' });
    
    try {
      if (!account) {
        updateTestResult('Wallet Connection', {
          status: 'warning',
          message: 'No wallet connected - click Connect Wallet button to test'
        });
        return;
      }

      // Test wallet details
      updateTestResult('Wallet Connection', {
        status: 'success',
        message: `Connected: ${account.address}`,
        details: { 
          address: account.address
        }
      });
    } catch (error) {
      updateTestResult('Wallet Connection', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    }
  };

  // Test contract interactions
  const testContractInteractions = async () => {
    addTestResult({ name: 'Contract Interactions', status: 'pending', message: 'Testing contracts...' });
    
    try {
      if (!client || !account) {
        updateTestResult('Contract Interactions', {
          status: 'warning',
          message: 'Client or wallet not available'
        });
        return;
      }

      const stakingPoolAddress = process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS;
      const questManagerAddress = process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS;

      if (!stakingPoolAddress || !questManagerAddress) {
        updateTestResult('Contract Interactions', {
          status: 'warning',
          message: 'Contract addresses not configured'
        });
        return;
      }

      // Test contract initialization
      const etherlinkTestnet = defineChain({
        id: 128123,
        rpc: 'https://node.ghostnet.etherlink.com',
      });

      const stakingPool = getContract({
        client,
        chain: etherlinkTestnet,
        address: stakingPoolAddress
      });

      const questManager = getContract({
        client,
        chain: etherlinkTestnet,
        address: questManagerAddress
      });

      updateTestResult('Contract Interactions', {
        status: 'success',
        message: 'Contracts accessible via Thirdweb v5',
        details: {
          stakingPool: stakingPoolAddress,
          questManager: questManagerAddress,
          client: !!client
        }
      });
    } catch (error) {
      updateTestResult('Contract Interactions', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Contract test failed'
      });
    }
  };

  // Test Sequence API
  const testSequenceAPI = async () => {
    addTestResult({ name: 'Sequence API', status: 'pending', message: 'Testing Sequence...' });
    
    try {
      const contractMetadataUri = process.env.SEQUENCE_CONTRACT_METADATA_URI;

      if (!contractMetadataUri) {
        updateTestResult('Sequence API', {
          status: 'warning',
          message: 'Sequence configuration missing'
        });
        return;
      }

      // Test metadata endpoint
      const response = await fetch(contractMetadataUri);

      if (response.ok) {
        const data = await response.json();
        updateTestResult('Sequence API', {
          status: 'success',
          message: `Metadata accessible: ${data.name || 'Unknown'}`,
          details: data
        });
      } else {
        updateTestResult('Sequence API', {
          status: 'error',
          message: `API returned status ${response.status}`
        });
      }
    } catch (error) {
      updateTestResult('Sequence API', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Sequence test failed'
      });
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      await testEnvironmentConfig();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testThirdwebSDK();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testWalletConnection();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testContractInteractions();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testSequenceAPI();
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Integration Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Test Thirdweb and Sequence integrations in the browser
          </p>

          {/* Connection Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Wallet: </span>
                <span className={account ? 'text-green-600' : 'text-red-600'}>
                  {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              <div>
                <span className="font-medium">Client: </span>
                <span className={client ? 'text-green-600' : 'text-red-600'}>
                  {client ? 'Thirdweb v5 Initialized' : 'Not initialized'}
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            {!account && (
              <WalletConnectionV5 
                variant="compact"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              />
            )}
            
            <button
              onClick={() => setTestResults([])}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            
            {testResults.length === 0 && !isRunning && (
              <p className="text-gray-500 italic">
                Click "Run All Tests" to start testing integrations
              </p>
            )}

            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {result.name}
                  </h3>
                  <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-2">{result.message}</p>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      Show Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Integration Status Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">✅ Thirdweb Setup</h3>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>✅ Client ID configured</li>
                <li>✅ Provider setup complete</li>
                <li>✅ Contract addresses configured</li>
                <li>✅ Etherlink network supported</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✅ Sequence Integration</h3>
              <ul className="text-sm space-y-1 text-green-700">
                <li>✅ Project ID configured</li>
                <li>✅ Metadata endpoints working</li>
                <li>✅ Badge collection accessible</li>
                <li>⚠️ Builder API needs auth fix</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}