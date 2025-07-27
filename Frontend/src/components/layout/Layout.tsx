'use client';

// ============ Imports ============
import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import WalletConnection from '../wallet/WalletConnection';
import { useWalletConnection } from '../wallet/WalletConnection';
import { toast, Toaster } from 'react-hot-toast';

// ============ Types ============
interface LayoutProps {
  children: ReactNode;
  className?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresWallet?: boolean;
  adminOnly?: boolean;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  currentPath: string;
  isConnected: boolean;
}

/**
 * @title Layout
 * @notice Main layout component with navigation, header, and responsive design
 * @dev Provides consistent layout structure across all pages
 */
export default function Layout({ children, className = "" }: LayoutProps) {
  
  // ============ Hooks ============
  const router = useRouter();
  const { isConnected, address } = useWalletConnection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ============ Effects ============
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // ============ Navigation Configuration ============
  const navigation: NavigationItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
    },
    {
      name: 'Staking',
      href: '/staking',
      icon: CurrencyDollarIcon,
      requiresWallet: true,
    },
    {
      name: 'Quests',
      href: '/quests',
      icon: TrophyIcon,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: UserCircleIcon,
      requiresWallet: true,
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Cog6ToothIcon,
      requiresWallet: true,
      adminOnly: true,
    },
  ];

  // Check if user is admin (simplified - in production, check contract roles)
  const isAdmin = address === process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

  // Filter navigation based on wallet connection and admin status
  const filteredNavigation = navigation.filter(item => {
    if (item.requiresWallet && !isConnected) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  // ============ Handlers ============
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavItemClick = (item: NavigationItem) => {
    if (item.requiresWallet && !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    router.push(item.href);
    setMobileMenuOpen(false);
  };

  // ============ Loading State ============
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ============ JSX Return ============
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', 
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">Quest</h1>
                  <p className="text-xs text-gray-500 -mt-1">DeFi NFT Game</p>
                </div>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {filteredNavigation.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={router.pathname === item.href}
                  onClick={() => handleNavItemClick(item)}
                />
              ))}
            </nav>

            {/* Right side - Wallet connection */}
            <div className="flex items-center space-x-4">
              <WalletConnection 
                variant="compact"
                className="hidden sm:block"
              />
              
              {/* Mobile menu button */}
              <button
                onClick={handleMobileMenuToggle}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigation={filteredNavigation}
        currentPath={router.pathname}
        isConnected={isConnected}
      />

      {/* Main content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ============ Navigation Item Component ============
interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
        ${isActive 
          ? 'text-primary-600 bg-primary-50' 
          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
        }
      `}
    >
      <item.icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
      <span>{item.name}</span>
    </button>
  );
}

// ============ Mobile Menu Component ============
function MobileMenu({ isOpen, onClose, navigation, currentPath, isConnected }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-3" onClick={onClose}>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Quest</h1>
                <p className="text-xs text-gray-500 -mt-1">DeFi NFT Game</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                  ${currentPath === item.href
                    ? 'text-primary-600 bg-primary-50 border border-primary-200'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className={`h-5 w-5 ${
                  currentPath === item.href ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Wallet connection in mobile */}
          <div className="p-4 border-t border-gray-200">
            <WalletConnection variant="default" />
          </div>
        </div>
      </div>
    </>
  );
}

// ============ Footer Component ============
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quest</h3>
                <p className="text-sm text-gray-500">DeFi-Powered NFT Quest Game</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              Complete community-driven quests, earn token rewards, and mint unique NFT badges. 
              Built on Etherlink with instant transactions and low fees.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/quests" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Browse Quests
                </Link>
              </li>
              <li>
                <Link href="/staking" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Staking Pool
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.quest.etherlink.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/quest" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/QuestDApp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Quest. Built on Etherlink. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <a 
              href="https://explorer.etherlink.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Block Explorer
            </a>
            <a 
              href="/privacy" 
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}