// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============ Imports ============
import { Script, console2 } from "forge-std/Script.sol";
import { StakingPool } from "../src/StakingPool.sol";
import { QuestManager } from "../src/QuestManager.sol";
import { NFTMinter } from "../src/NFTMinter.sol";

/**
 * @title Deploy
 * @author Quest Team
 * @notice Deployment script for Quest dApp contracts on Etherlink
 * @dev Deploys StakingPool, QuestManager, and NFTMinter contracts with proper configuration
 */
contract Deploy is Script {
    // ============ State variables ============
    // Etherlink USDC address
    address constant ETHERLINK_USDC = 0x4C2AA252BEe766D3399850569713b55178934849;

    // Deployment configuration
    struct DeploymentConfig {
        address usdcToken;
        uint256 minimumStakeAmount;
        string baseURI;
        bool shouldPause;
    }

    // Contract instances
    StakingPool public stakingPool;
    QuestManager public questManager;
    NFTMinter public nftMinter;

    // ============ Main deployment function ============
    function run() external {
        // Get deployment configuration
        DeploymentConfig memory config = getDeploymentConfig();

        // Get deployer address (works with both encrypted wallet and private key)
        address deployer = msg.sender;

        console2.log("=== Quest dApp Deployment ===");
        console2.log("Deployer address:", deployer);
        console2.log("Deployer balance:", deployer.balance);
        console2.log("USDC token address:", config.usdcToken);
        console2.log("");

        // Start broadcasting transactions (works with encrypted wallet)
        vm.startBroadcast();

        // Deploy contracts in order
        deployStakingPool(config);
        deployQuestManager();
        deployNFTMinter(config);

        // Configure contract relationships
        configureContracts();

        // Initial setup
        initialSetup(config);

        vm.stopBroadcast();

        // Log deployment summary
        logDeploymentSummary();

        // Save deployment artifacts
        saveDeploymentInfo();
    }

    // ============ Deployment functions ============
    /**
     * @notice Deploy StakingPool contract
     * @param config Deployment configuration
     */
    function deployStakingPool(DeploymentConfig memory config) internal {
        console2.log("Deploying StakingPool...");

        stakingPool = new StakingPool(config.usdcToken);

        console2.log("StakingPool deployed at:", address(stakingPool));
        console2.log("StakingPool owner:", stakingPool.owner());
        console2.log("");
    }

    /**
     * @notice Deploy QuestManager contract
     */
    function deployQuestManager() internal {
        console2.log("Deploying QuestManager...");

        questManager = new QuestManager(address(stakingPool), msg.sender);

        console2.log("QuestManager deployed at:", address(questManager));
        console2.log("QuestManager owner:", questManager.owner());
        console2.log("");
    }

    /**
     * @notice Deploy NFTMinter contract
     */
    function deployNFTMinter(DeploymentConfig memory /* config */ ) internal {
        console2.log("Deploying NFTMinter...");

        nftMinter = new NFTMinter();

        console2.log("NFTMinter deployed at:", address(nftMinter));
        console2.log("NFTMinter owner:", nftMinter.owner());
        console2.log("NFTMinter name:", nftMinter.name());
        console2.log("NFTMinter symbol:", nftMinter.symbol());
        console2.log("");
    }

    /**
     * @notice Configure contract relationships and permissions
     */
    function configureContracts() internal {
        console2.log("Configuring contract relationships...");

        // Set QuestManager in StakingPool
        stakingPool.setQuestManager(address(questManager));
        console2.log("StakingPool.setQuestManager:", address(questManager));

        // Set NFTMinter in QuestManager
        questManager.setNFTMinter(address(nftMinter));
        console2.log("QuestManager.setNFTMinter:", address(nftMinter));

        // Set QuestManager in NFTMinter
        nftMinter.setQuestManager(address(questManager));
        console2.log("NFTMinter.setQuestManager:", address(questManager));

        console2.log("");
    }

    /**
     * @notice Perform initial setup (unpause contracts, set configurations)
     * @param config Deployment configuration
     */
    function initialSetup(DeploymentConfig memory config) internal {
        console2.log("Performing initial setup...");

        // Unpause StakingPool (it starts paused for safety)
        stakingPool.unpause();
        console2.log("StakingPool unpaused");

        // Set minimum stake amount if different from default
        if (config.minimumStakeAmount > 0) {
            stakingPool.setMinimumStakeAmount(config.minimumStakeAmount);
            console2.log("StakingPool minimum stake amount set:", config.minimumStakeAmount);
        }

        // Set base URI for NFTs if provided
        if (bytes(config.baseURI).length > 0) {
            nftMinter.setBaseURI(config.baseURI);
            console2.log("NFTMinter base URI set:", config.baseURI);
        }

        // Create the default quest
        questManager.createDefaultQuest();
        console2.log("Default quest created with ID:", questManager.getDefaultQuestId());

        // Leave contracts unpaused unless specified
        if (!config.shouldPause) {
            // QuestManager and NFTMinter start unpaused, so no action needed
            console2.log("All contracts active and ready for use");
        } else {
            questManager.pause();
            nftMinter.pause();
            console2.log("Contracts paused for additional setup");
        }

        console2.log("");
    }

    // ============ Configuration functions ============
    /**
     * @notice Get deployment configuration based on chain
     * @return config Deployment configuration struct
     */
    function getDeploymentConfig() internal view returns (DeploymentConfig memory config) {
        uint256 chainId = block.chainid;

        if (chainId == 42793) {
            // Etherlink Mainnet
            config = DeploymentConfig({
                usdcToken: ETHERLINK_USDC, // Update with actual Etherlink USDC address
                minimumStakeAmount: 1e6, // 1 USDC minimum
                baseURI: "https://quest-api.etherlink.com/metadata/",
                shouldPause: false
            });
        } else if (chainId == 128123) {
            // Etherlink Testnet
            config = DeploymentConfig({
                usdcToken: ETHERLINK_USDC, // Update with testnet USDC address
                minimumStakeAmount: 1e5, // 0.1 USDC minimum for testing
                baseURI: "https://quest-api-testnet.etherlink.com/metadata/",
                shouldPause: false
            });
        } else {
            // Local/other networks - use mock values
            config = DeploymentConfig({
                usdcToken: ETHERLINK_USDC, // Will need to deploy mock USDC
                minimumStakeAmount: 1e6,
                baseURI: "",
                shouldPause: false
            });
        }
    }

    // ============ Utility functions ============
    /**
     * @notice Log deployment summary with all contract addresses
     */
    function logDeploymentSummary() internal view {
        console2.log("=== DEPLOYMENT SUMMARY ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Block number:", block.number);
        console2.log("Timestamp:", block.timestamp);
        console2.log("");
        console2.log("Contract Addresses:");
        console2.log("StakingPool:  ", address(stakingPool));
        console2.log("QuestManager: ", address(questManager));
        console2.log("NFTMinter:    ", address(nftMinter));
        console2.log("");
        console2.log("Configuration:");
        console2.log("USDC Token:   ", stakingPool.getStakingToken());
        console2.log("Default Quest ID:", questManager.getDefaultQuestId());
        console2.log("NFT Collection:", nftMinter.name());
        console2.log("NFT Symbol:", nftMinter.symbol());
        console2.log("");
        console2.log("Deployment completed successfully!");
        console2.log("========================");
    }

    /**
     * @notice Save deployment information to JSON file
     * @dev This creates a deployment artifact that frontend can use
     */
    function saveDeploymentInfo() internal {
        string memory chainId = vm.toString(block.chainid);
        string memory deploymentJson = string(
            abi.encodePacked(
                "{",
                '"chainId": ',
                chainId,
                ",",
                '"network": "',
                getNetworkName(),
                '",',
                '"timestamp": ',
                vm.toString(block.timestamp),
                ",",
                '"blockNumber": ',
                vm.toString(block.number),
                ",",
                '"contracts": {',
                '"StakingPool": "',
                vm.toString(address(stakingPool)),
                '",',
                '"QuestManager": "',
                vm.toString(address(questManager)),
                '",',
                '"NFTMinter": "',
                vm.toString(address(nftMinter)),
                '"',
                "},",
                '"config": {',
                '"usdcToken": "',
                vm.toString(stakingPool.getStakingToken()),
                '",',
                '"defaultQuestId": ',
                vm.toString(questManager.getDefaultQuestId()),
                ",",
                '"nftName": "',
                nftMinter.name(),
                '",',
                '"nftSymbol": "',
                nftMinter.symbol(),
                '"',
                "}",
                "}"
            )
        );

        string memory filename = string(abi.encodePacked("./deployments/", chainId, ".json"));

        vm.writeFile(filename, deploymentJson);
        console2.log("Deployment info saved to:", filename);
    }

    /**
     * @notice Get network name based on chain ID
     * @return Network name string
     */
    function getNetworkName() internal view returns (string memory) {
        uint256 chainId = block.chainid;

        if (chainId == 42793) return "etherlink-mainnet";
        if (chainId == 128123) return "etherlink-testnet";
        if (chainId == 31337) return "anvil";
        if (chainId == 1) return "mainnet";
        if (chainId == 11155111) return "sepolia";

        return string(abi.encodePacked("unknown-", vm.toString(chainId)));
    }

    // ============ Verification functions ============
    /**
     * @notice Verify deployment was successful
     * @dev Call this after deployment to ensure everything is configured correctly
     */
    function verifyDeployment() external view {
        console2.log("=== DEPLOYMENT VERIFICATION ===");

        // Verify StakingPool
        require(address(stakingPool) != address(0), "StakingPool not deployed");
        require(stakingPool.getQuestManager() == address(questManager), "StakingPool quest manager not set");
        require(!stakingPool.paused(), "StakingPool should not be paused");
        console2.log("StakingPool verification passed");

        // Verify QuestManager
        require(address(questManager) != address(0), "QuestManager not deployed");
        (address stakingPoolAddr,,,,) = questManager.getConfig();
        require(stakingPoolAddr == address(stakingPool), "QuestManager staking pool not set");
        require(questManager.getDefaultQuestId() == 1, "Default quest not created");
        console2.log("QuestManager verification passed");

        // Verify NFTMinter
        require(address(nftMinter) != address(0), "NFTMinter not deployed");
        (,, address questManagerAddr) = nftMinter.getCollectionStats();
        require(questManagerAddr == address(questManager), "NFTMinter quest manager not set");
        console2.log("NFTMinter verification passed");

        console2.log("All contracts deployed and configured correctly!");
        console2.log("==============================");
    }
}
