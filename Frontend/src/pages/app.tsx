// ============ Imports ============
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import CustomThirdwebProvider from '../components/providers/ThirdwebProvider';
import Layout from '../components/layout/Layout';
import '../styles/globals.css';

/**
 * @title Quest dApp Application
 * @notice Main Next.js application wrapper with all necessary providers
 * @dev Configures Thirdweb for Etherlink, toast notifications, and app layout
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomThirdwebProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </CustomThirdwebProvider>
  );
}