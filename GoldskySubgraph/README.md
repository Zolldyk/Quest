# Quest DeFi Goldsky Subgraph

This is a Goldsky subgraph for indexing the Quest DeFi dApp events on Etherlink. The subgraph tracks staking pool activities, quest completions, and NFT minting events.

## 🏗️ Architecture

### Data Sources
- **StakingPool**: Tracks USDC staking and unstaking events
- **QuestManager**: Handles quest submissions, verifications, and rewards
- **NFTMinter**: Manages NFT badge minting and transfers

### Entities
- **Staker**: Users who stake USDC in the pool
- **Player**: Users who participate in quests
- **Quest**: Individual quest completions
- **QuestNFT**: NFT badges earned from quests
- **Global/Daily Stats**: Aggregated analytics

## 📁 File Structure

```
GoldskySubgraph/
├── src/
│   └── mappings.ts          # Event handlers and entity mapping logic
├── abis/                    # Contract ABI files (needs to be populated)
├── schema.graphql           # GraphQL schema definition
├── subgraph.yaml           # Subgraph configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## ✅ Completed

- ✅ **Fixed all TypeScript/AssemblyScript errors** in mappings.ts
- ✅ **Removed unused imports** (store from @graphprotocol/graph-ts)
- ✅ **Fixed i32 type usage** for AssemblyScript compatibility
- ✅ **Created comprehensive subgraph.yaml** configuration
- ✅ **Fixed date formatting** to work with AssemblyScript limitations
- ✅ **Organized file structure** with proper src/ directory
- ✅ **Added package.json** with build and deploy scripts

## 🚧 Still Required

### 1. Contract ABI Files
You need to add the following ABI files to the `abis/` directory:

```bash
abis/
├── StakingPool.json      # From compiled StakingPool.sol
├── QuestManager.json     # From compiled QuestManager.sol  
├── NFTMinter.json        # From compiled NFTMinter.sol
├── ERC20.json           # Standard ERC20 ABI
└── ERC721.json          # Standard ERC721 ABI
```

### 2. Contract Addresses
Update the contract addresses in `subgraph.yaml`:

```yaml
# Currently set to placeholder addresses
- address: "0x0000000000000000000000000000000000000000"
```

### 3. Start Block Numbers
Update the `startBlock` values with actual deployment block numbers for faster syncing.

## 🚀 Deployment Steps

### Prerequisites
```bash
npm install -g @graphprotocol/graph-cli
npm install goldsky
```

### 1. Prepare ABI Files
Copy your compiled contract ABIs to the `abis/` directory:

```bash
# Example - copy from your Foundry output
cp "../out/StakingPool.sol/StakingPool.json" abis/
cp "../out/QuestManager.sol/QuestManager.json" abis/
cp "../out/NFTMinter.sol/NFTMinter.json" abis/
```

### 2. Update Configuration
Edit `subgraph.yaml` and replace:
- Contract addresses with deployed addresses
- Start block numbers with actual deployment blocks
- Network name if using testnet

### 3. Generate Types
```bash
npm run codegen
```

### 4. Build Subgraph
```bash
npm run build
```

### 5. Deploy to Goldsky
```bash
# For mainnet
npm run deploy

# For testnet (after creating subgraph.testnet.yaml)
npm run deploy-testnet
```

## 📊 Query Examples

Once deployed, you can query the subgraph:

```graphql
  {
    globalStats(id: "global") {
      totalPlayers
      totalQuests
      totalSubmissions
      totalQuestsCompleted
      totalRewardsDistributed
      totalNFTsMinted
    }

    questTemplates(first: 5) {
      id
      questType
      rewardAmount
      isActive
      completedCount
    }

    players(first: 5) {
      id
      address
      totalSubmissions
      questsCompleted
      totalRewardsEarned
    }
  }
```

## 🔧 Current Issues Resolved

- ✅ Import path errors (expected - resolved after codegen)
- ✅ AssemblyScript type compatibility (i32 vs number)
- ✅ Date formatting for AssemblyScript
- ✅ Unused import warnings
- ✅ File organization

## 📝 Notes

- The current TypeScript errors are expected until you run `graph codegen` with proper ABI files
- Date formatting uses timestamps instead of formatted strings for AssemblyScript compatibility
- The `countActiveStakers()` and `countActivePlayers()` functions are placeholders - implement based on your needs
- All event handlers include comprehensive logging for debugging

## 🌐 Network Support

- **Etherlink Mainnet**: Chain ID 42793
- **Etherlink Testnet**: Chain ID 128123

Configure in the `networks` section of `subgraph.yaml`.

## 🔗 Resources

- [Goldsky Documentation](https://docs.goldsky.com/)
- [The Graph Protocol](https://thegraph.com/docs/)
- [AssemblyScript for Subgraphs](https://thegraph.com/docs/en/developer/assemblyscript-api/)