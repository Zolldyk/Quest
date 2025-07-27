/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // Enable experimental features for better performance
    experimental: {
      scrollRestoration: true,
    },
  
    // Image optimization configuration
    images: {
      domains: [
        'cdn.quest.etherlink.com',
        'ipfs.io',
        'gateway.pinata.cloud',
        'sequence.app',
        'assets.sequence.build'
      ],
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
  
    // Environment variables validation
    env: {
      CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
  
    // Webpack configuration for Web3 compatibility (simplified for v5)
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Handle node modules that need polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
  
      // Handle ESM modules
      config.experiments = {
        ...config.experiments,
        topLevelAwait: true,
      };
  
      return config;
    },
  
    // Headers for security and CORS
    async headers() {
      return [
        {
          source: '/api/(.*)',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
  
    // Redirects for better UX
    async redirects() {
      return [
        {
          source: '/quest',
          destination: '/quests',
          permanent: true,
        },
        {
          source: '/stake',
          destination: '/staking',
          permanent: true,
        },
      ];
    },
  
    // TypeScript configuration
    typescript: {
      // Dangerously allow production builds to complete even with TypeScript errors
      // Set to false in production
      ignoreBuildErrors: process.env.NODE_ENV === 'development',
    },
  
    // ESLint configuration
    eslint: {
      // Only run ESLint on these directories during builds
      dirs: ['Frontend/app', 'Frontend/src'],
    },
  
    // Compiler options for better performance
    compiler: {
      // Remove console.log in production builds
      removeConsole: process.env.NODE_ENV === 'production',
    },
  
    // Output configuration for deployment
    output: 'standalone',
    
    // Note: i18n removed as it's not supported in App Router
  };
  
  module.exports = nextConfig;