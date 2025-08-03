'use client';
// Force deployment refresh

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrophyIcon,
  CurrencyDollarIcon,
  StarIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import WalletConnectionV5 from '../Frontend/src/components/wallet/WalletConnectionV5';
import { useAddress } from '../Frontend/src/hooks/useThirdwebV5';

export default function HomePage() {
  const address = useAddress();

  // Debug: Log wallet address and admin address for troubleshooting
  console.log('Current address:', address);
  console.log('Admin address:', process.env.NEXT_PUBLIC_ADMIN_ADDRESS);
  console.log('Current trimmed/lower:', address?.toLowerCase().trim());
  console.log('Admin trimmed/lower:', process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase().trim());
  
  const isAdmin = address && process.env.NEXT_PUBLIC_ADMIN_ADDRESS && 
    address.toLowerCase().trim() === process.env.NEXT_PUBLIC_ADMIN_ADDRESS.toLowerCase().trim();
  console.log('Addresses match:', isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quest DApp</h1>
                <p className="text-xs text-gray-500">DeFi NFT Game</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {address && (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/staking" className="text-gray-700 hover:text-blue-600 font-medium">
                    Staking
                  </Link>
                  <Link href="/quests" className="text-gray-700 hover:text-blue-600 font-medium">
                    Quests
                  </Link>
                  {/* Show admin link if user is admin */}
                  {isAdmin && (
                    <Link href="/admin" className="text-purple-700 hover:text-purple-600 font-medium">
                      Admin
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Wallet Connection */}
            <WalletConnectionV5 variant="compact" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              DeFi-Powered
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> NFT Quest Game</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Complete community-driven quests, earn token rewards, and mint unique NFT badges. 
              Built on Etherlink with instant transactions and low fees.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!address ? (
                <div className="flex flex-col items-center space-y-4">
                  <WalletConnectionV5 variant="default" />
                  <p className="text-sm text-gray-500">Connect your wallet to get started</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/dashboard"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>Enter Dashboard</span>
                  </Link>
                  <Link 
                    href="/quests"
                    className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                  >
                    <TrophyIcon className="w-5 h-5" />
                    <span>Browse Quests</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Quest DApp Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Participate in the DeFi ecosystem while having fun and earning rewards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stake Tokens</h3>
              <p className="text-gray-600 text-sm">
                Stake your USDC tokens in our pool to participate in quests and earn rewards
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Quests</h3>
              <p className="text-gray-600 text-sm">
                Submit quest proofs like social media posts to earn token rewards
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mint NFT Badges</h3>
              <p className="text-gray-600 text-sm">
                Get unique NFT badges for each completed quest via Sequence
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">
                Monitor your earnings, badges, and quest history in your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Join the Quest Community</h2>
              <p className="text-blue-100 text-lg">
                Built on Etherlink for fast, low-cost transactions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">$0.01</div>
                <div className="text-blue-100">Average Transaction Cost</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">&lt;1s</div>
                <div className="text-blue-100">Transaction Confirmation</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-blue-100">Decentralized & Open Source</div>
              </div>
            </div>

            <div className="text-center mt-12">
              {!address ? (
                <WalletConnectionV5 variant="default" />
              ) : (
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>Get Started</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Quest DApp</h3>
                  <p className="text-sm text-gray-400">DeFi-Powered NFT Quest Game</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Complete community-driven quests, earn token rewards, and mint unique NFT badges. 
                Built on Etherlink with instant transactions and low fees.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/quests" className="hover:text-white transition-colors">Browse Quests</Link></li>
                <li><Link href="/staking" className="hover:text-white transition-colors">Staking Pool</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://docs.etherlink.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="https://explorer.etherlink.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Block Explorer</a></li>
                <li><a href="https://github.com/etherlinkcom" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© 2024 Quest DApp. Built on Etherlink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}