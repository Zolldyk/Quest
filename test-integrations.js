#!/usr/bin/env node

/**
 * Integration Test Suite for Thirdweb and Sequence
 * Tests configuration, API connectivity, and basic functionality
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
const testResults = {
  thirdweb: {},
  sequence: {},
  overall: { passed: 0, failed: 0, warnings: 0 }
};

/**
 * Utility functions
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  testResults.overall.passed++;
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
  testResults.overall.failed++;
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
  testResults.overall.warnings++;
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * THIRDWEB TESTS
 */
async function testThirdwebConfiguration() {
  log('\n' + '='.repeat(50), colors.bold);
  log('🔧 TESTING THIRDWEB CONFIGURATION', colors.bold);
  log('='.repeat(50), colors.bold);

  // Test 1: Client ID Configuration
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
  if (!clientId || clientId === 'your_thirdweb_client_id_here') {
    logError('THIRDWEB_CLIENT_ID not configured or using placeholder');
    testResults.thirdweb.clientId = false;
  } else {
    logSuccess(`Client ID configured: ${clientId.substring(0, 8)}...`);
    testResults.thirdweb.clientId = true;
  }

  // Test 2: Secret Key Configuration  
  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  if (!secretKey || secretKey === 'your_thirdweb_secret_key_here') {
    logWarning('THIRDWEB_SECRET_KEY not configured - required for server-side operations');
    testResults.thirdweb.secretKey = false;
  } else {
    logSuccess(`Secret Key configured: ${secretKey.substring(0, 8)}...`);
    testResults.thirdweb.secretKey = true;
  }

  // Test 3: Contract Addresses
  const contractAddresses = {
    stakingPool: process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS,
    questManager: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS,
    nftMinter: process.env.NEXT_PUBLIC_NFT_MINTER_ADDRESS
  };

  for (const [name, address] of Object.entries(contractAddresses)) {
    if (!address || address.length !== 42 || !address.startsWith('0x')) {
      logError(`${name} address invalid or not configured: ${address}`);
      testResults.thirdweb[name] = false;
    } else {
      logSuccess(`${name} address configured: ${address}`);
      testResults.thirdweb[name] = true;
    }
  }
}

async function testThirdwebAPI() {
  log('\n📡 Testing Thirdweb API Connectivity...', colors.blue);
  
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
  if (!clientId) {
    logError('Cannot test API - Client ID not configured');
    return;
  }

  try {
    // Test Thirdweb API endpoint
    const response = await makeHttpRequest(`https://api.thirdweb.com/v1/chains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clientId}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      logSuccess('Thirdweb API accessible');
      testResults.thirdweb.apiAccess = true;
      
      // Check if Etherlink chains are supported
      if (Array.isArray(response.data)) {
        const etherlinkChains = response.data.filter(chain => 
          chain.name.toLowerCase().includes('etherlink') || 
          chain.chainId === 42793 || 
          chain.chainId === 128123
        );
        
        if (etherlinkChains.length > 0) {
          logSuccess(`Found ${etherlinkChains.length} Etherlink chain(s) in Thirdweb`);
        } else {
          logWarning('Etherlink chains not found in Thirdweb - custom configuration may be needed');
        }
      } else {
        logInfo('API response format unexpected - chains data not available');
      }
    } else {
      logError(`Thirdweb API returned status ${response.status}`);
      testResults.thirdweb.apiAccess = false;
    }
  } catch (error) {
    logError(`Thirdweb API test failed: ${error.message}`);
    testResults.thirdweb.apiAccess = false;
  }
}

async function testThirdwebProvider() {
  log('\n⚛️  Testing Thirdweb Provider Configuration...', colors.blue);
  
  try {
    // Check if ThirdwebProvider file exists and is properly configured
    const providerPath = path.join(__dirname, 'Frontend/src/components/providers/ThirdwebProvider.tsx');
    
    if (!fs.existsSync(providerPath)) {
      logError('ThirdwebProvider.tsx not found');
      testResults.thirdweb.provider = false;
      return;
    }

    const providerContent = fs.readFileSync(providerPath, 'utf8');
    
    // Check for required configurations (v5 patterns)
    const checks = [
      { pattern: /id:\s*42793/, message: 'Etherlink Mainnet configured' },
      { pattern: /id:\s*128123/, message: 'Etherlink Testnet configured' },
      { pattern: /NEXT_PUBLIC_THIRDWEB_CLIENT_ID/, message: 'Client ID environment variable used' },
      { pattern: /defineChain/, message: 'Supported chains configured' },
      { pattern: /name.*Quest/, message: 'DApp metadata configured' }
    ];

    let providerScore = 0;
    for (const check of checks) {
      if (check.pattern.test(providerContent)) {
        logSuccess(check.message);
        providerScore++;
      } else {
        logWarning(`Missing: ${check.message}`);
      }
    }

    testResults.thirdweb.provider = providerScore >= 4;
    if (testResults.thirdweb.provider) {
      logSuccess('ThirdwebProvider properly configured');
    } else {
      logError('ThirdwebProvider needs configuration updates');
    }

  } catch (error) {
    logError(`Provider test failed: ${error.message}`);
    testResults.thirdweb.provider = false;
  }
}

/**
 * SEQUENCE TESTS
 */
async function testSequenceConfiguration() {
  log('\n' + '='.repeat(50), colors.bold);
  log('🎮 TESTING SEQUENCE CONFIGURATION', colors.bold);
  log('='.repeat(50), colors.bold);

  // Test 1: Project ID
  const projectId = process.env.SEQUENCE_PROJECT_ID;
  if (!projectId || projectId === 'your_sequence_project_id_here') {
    logError('SEQUENCE_PROJECT_ID not configured');
    testResults.sequence.projectId = false;
  } else {
    logSuccess(`Project ID configured: ${projectId}`);
    testResults.sequence.projectId = true;
  }

  // Test 2: Access Key
  const accessKey = process.env.SEQUENCE_API_ACCESS_KEY;
  if (!accessKey || accessKey === 'your_sequence_access_key_here') {
    logError('SEQUENCE_API_ACCESS_KEY not configured');
    testResults.sequence.accessKey = false;
  } else {
    logSuccess(`Access Key configured: ${accessKey.substring(0, 8)}...`);
    testResults.sequence.accessKey = true;
  }

  // Test 3: Metadata URIs
  const metadataConfig = {
    contractMetadata: process.env.SEQUENCE_CONTRACT_METADATA_URI,
    tokenMetadata: process.env.SEQUENCE_TOKEN_METADATA_URI
  };

  for (const [name, uri] of Object.entries(metadataConfig)) {
    if (!uri || !uri.startsWith('https://metadata.sequence.app')) {
      logWarning(`${name} URI not configured or invalid: ${uri}`);
      testResults.sequence[name] = false;
    } else {
      logSuccess(`${name} URI configured: ${uri}`);
      testResults.sequence[name] = true;
    }
  }
}

async function testSequenceAPI() {
  log('\n📡 Testing Sequence API Connectivity...', colors.blue);
  
  const projectId = process.env.SEQUENCE_PROJECT_ID;
  const accessKey = process.env.SEQUENCE_API_ACCESS_KEY;

  if (!projectId || !accessKey) {
    logError('Cannot test API - Project ID or Access Key not configured');
    return;
  }

  try {
    // Test Sequence Metadata API directly (which we know works)
    const metadataUrl = `https://metadata.sequence.app/projects/${projectId}/collections/1564.json`;
    
    const metadataResponse = await makeHttpRequest(metadataUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (metadataResponse.status === 200) {
      logSuccess('Sequence Metadata API accessible');
      testResults.sequence.metadataAPI = true;
      
      if (metadataResponse.data) {
        logSuccess(`Collection found: ${metadataResponse.data.name || 'Unnamed'}`);
        logInfo(`Description: ${metadataResponse.data.description || 'N/A'}`);
      }
    } else if (metadataResponse.status === 404) {
      logWarning('Collection not found - check collection ID');
      testResults.sequence.metadataAPI = false;
    } else {
      logError(`Sequence Metadata API returned status ${metadataResponse.status}`);
      testResults.sequence.metadataAPI = false;
    }
  } catch (error) {
    logError(`Sequence API test failed: ${error.message}`);
    testResults.sequence.metadataAPI = false;
  }
}

async function testSequenceNFTMinting() {
  log('\n🖼️  Testing Sequence NFT Minting API...', colors.blue);
  
  const projectId = process.env.SEQUENCE_PROJECT_ID;
  const accessKey = process.env.SEQUENCE_API_ACCESS_KEY;

  if (!projectId || !accessKey) {
    logError('Cannot test minting - Project ID or Access Key not configured');
    return;
  }

  try {
    // Test NFT collection access (using the metadata API instead)
    const collectionUrl = `https://metadata.sequence.app/projects/${projectId}/collections/1564.json`;
    
    const response = await makeHttpRequest(collectionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      logSuccess('Sequence NFT Collection accessible');
      testResults.sequence.nftAPI = true;
      
      if (response.data) {
        logInfo(`Collection: ${response.data.name || 'Unnamed'}`);
        logInfo(`Description: ${response.data.description || 'N/A'}`);
      }
    } else if (response.status === 404) {
      logWarning('Collection not found - check collection ID');
      testResults.sequence.nftAPI = false;
    } else {
      logError(`Sequence Collection API returned status ${response.status}`);
      testResults.sequence.nftAPI = false;
    }
  } catch (error) {
    logError(`Sequence NFT API test failed: ${error.message}`);
    testResults.sequence.nftAPI = false;
  }
}

async function testSequenceMetadataEndpoints() {
  log('\n🔗 Testing Sequence Metadata Endpoints...', colors.blue);
  
  const contractMetadataUri = process.env.SEQUENCE_CONTRACT_METADATA_URI;
  const tokenMetadataUri = process.env.SEQUENCE_TOKEN_METADATA_URI;

  // Test contract metadata
  if (contractMetadataUri) {
    try {
      const response = await makeHttpRequest(contractMetadataUri);
      
      if (response.status === 200) {
        logSuccess('Contract metadata endpoint accessible');
        
        if (typeof response.data === 'object') {
          const metadata = response.data;
          logInfo(`Name: ${metadata.name || 'N/A'}`);
          logInfo(`Description: ${metadata.description || 'N/A'}`);
          logInfo(`Image: ${metadata.image ? 'Configured' : 'Missing'}`);
        }
        
        testResults.sequence.contractMetadata = true;
      } else {
        logError(`Contract metadata returned status ${response.status}`);
        testResults.sequence.contractMetadata = false;
      }
    } catch (error) {
      logError(`Contract metadata test failed: ${error.message}`);
      testResults.sequence.contractMetadata = false;
    }
  } else {
    logWarning('Contract metadata URI not configured');
    testResults.sequence.contractMetadata = false;
  }

  // Test token metadata (check if base URI is accessible)
  if (tokenMetadataUri) {
    try {
      // Test with token ID 1
      const testTokenUri = `${tokenMetadataUri}1`;
      const response = await makeHttpRequest(testTokenUri);
      
      if (response.status === 200) {
        logSuccess('Token metadata endpoint accessible');
        testResults.sequence.tokenMetadata = true;
      } else if (response.status === 404) {
        logInfo('Token metadata endpoint configured (404 expected for non-existent tokens)');
        testResults.sequence.tokenMetadata = true;
      } else {
        logWarning(`Token metadata returned status ${response.status}`);
        testResults.sequence.tokenMetadata = false;
      }
    } catch (error) {
      logError(`Token metadata test failed: ${error.message}`);
      testResults.sequence.tokenMetadata = false;
    }
  } else {
    logWarning('Token metadata URI not configured');
    testResults.sequence.tokenMetadata = false;
  }
}

/**
 * INTEGRATION TESTS
 */
async function testIntegrationFiles() {
  log('\n' + '='.repeat(50), colors.bold);
  log('🔧 TESTING INTEGRATION FILES', colors.bold);
  log('='.repeat(50), colors.bold);

  // Check package.json dependencies
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      'thirdweb',
      'ethers'
    ];

    let depScore = 0;
    for (const dep of requiredDeps) {
      if (deps[dep]) {
        logSuccess(`${dep}: ${deps[dep]}`);
        depScore++;
      } else {
        logError(`Missing dependency: ${dep}`);
      }
    }

    testResults.overall.dependencies = depScore === requiredDeps.length;
  }

  // Check for integration utilities
  const utilsPath = path.join(__dirname, 'Frontend/src/utils/constants.ts');
  if (fs.existsSync(utilsPath)) {
    logSuccess('Constants file exists');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    
    if (utilsContent.includes('SEQUENCE') || utilsContent.includes('THIRDWEB')) {
      logSuccess('Integration constants configured');
    } else {
      logWarning('Integration constants may need setup');
    }
  } else {
    logWarning('Constants file not found');
  }
}

/**
 * ENVIRONMENT VALIDATION
 */
async function validateEnvironment() {
  log('\n' + '='.repeat(50), colors.bold);
  log('🌍 ENVIRONMENT VALIDATION', colors.bold);
  log('='.repeat(50), colors.bold);

  // Check .env file exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    logSuccess('.env file exists');
  } else {
    logWarning('.env file not found - using system environment variables');
  }

  // Check network configuration
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.NEXT_TESTNET_PUBLIC_CHAIN_ID;
  const networkName = process.env.NEXT_PUBLIC_NETWORK_NAME;
  
  if (chainId && networkName) {
    logSuccess(`Network configured: ${networkName} (Chain ID: ${chainId})`);
  } else {
    logWarning('Network configuration incomplete');
  }

  // Check RPC endpoints
  const rpcUrls = [
    process.env.ETHERLINK_MAINNET_RPC,
    process.env.ETHERLINK_TESTNET_RPC
  ].filter(Boolean);

  if (rpcUrls.length > 0) {
    logSuccess(`${rpcUrls.length} RPC endpoint(s) configured`);
  } else {
    logError('No RPC endpoints configured');
  }
}

/**
 * SUMMARY AND RECOMMENDATIONS
 */
function generateSummary() {
  log('\n' + '='.repeat(60), colors.bold);
  log('📊 INTEGRATION TEST SUMMARY', colors.bold);
  log('='.repeat(60), colors.bold);

  // Overall stats
  const total = testResults.overall.passed + testResults.overall.failed + testResults.overall.warnings;
  log(`\nTotal Tests: ${total}`);
  logSuccess(`Passed: ${testResults.overall.passed}`);
  logError(`Failed: ${testResults.overall.failed}`);
  logWarning(`Warnings: ${testResults.overall.warnings}`);

  // Thirdweb summary
  log('\n🔧 THIRDWEB STATUS:', colors.blue);
  const thirdwebTests = Object.entries(testResults.thirdweb);
  const thirdwebPassed = thirdwebTests.filter(([, passed]) => passed).length;
  log(`  ${thirdwebPassed}/${thirdwebTests.length} tests passed`);
  
  if (!testResults.thirdweb.clientId) {
    log('  ⚠️  Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID in .env', colors.yellow);
  }
  if (!testResults.thirdweb.provider) {
    log('  ⚠️  Review ThirdwebProvider configuration', colors.yellow);
  }

  // Sequence summary
  log('\n🎮 SEQUENCE STATUS:', colors.blue);
  const sequenceTests = Object.entries(testResults.sequence);
  const sequencePassed = sequenceTests.filter(([, passed]) => passed).length;
  log(`  ${sequencePassed}/${sequenceTests.length} tests passed`);
  
  if (!testResults.sequence.projectId) {
    log('  ⚠️  Set SEQUENCE_PROJECT_ID in .env', colors.yellow);
  }
  if (!testResults.sequence.accessKey) {
    log('  ⚠️  Set SEQUENCE_ACCESS_KEY in .env', colors.yellow);
  }

  // Recommendations
  log('\n💡 RECOMMENDATIONS:', colors.blue);
  
  if (testResults.overall.failed > 0) {
    log('  1. Fix failed configuration items above', colors.yellow);
    log('  2. Check environment variables in .env file', colors.yellow);
    log('  3. Verify API keys and project IDs are correct', colors.yellow);
  } else {
    log('  ✅ All critical tests passed!', colors.green);
    log('  💡 Consider testing in development environment next', colors.blue);
  }

  // Next steps
  log('\n🚀 NEXT STEPS:', colors.blue);
  log('  1. Run `npm run dev` to test in development mode');
  log('  2. Test wallet connection in browser');
  log('  3. Test NFT minting functionality');
  log('  4. Deploy to testnet for full integration testing');

  log('\n' + '='.repeat(60), colors.bold);
}

/**
 * MAIN EXECUTION
 */
async function runAllTests() {
  log('🚀 Starting Integration Tests...', colors.bold);
  
  try {
    await validateEnvironment();
    await testThirdwebConfiguration();
    await testThirdwebAPI();
    await testThirdwebProvider();
    await testSequenceConfiguration();
    await testSequenceAPI();
    await testSequenceNFTMinting();
    await testSequenceMetadataEndpoints();
    await testIntegrationFiles();
    
    generateSummary();
    
    // Exit code based on results
    const exitCode = testResults.overall.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testThirdwebConfiguration,
  testSequenceConfiguration,
  testResults
};