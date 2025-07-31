// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { QuestManager } from "../src/QuestManager.sol";

/**
 * @title CreateDefaultQuest
 * @notice Script to create the default quest on existing QuestManager contract
 */
contract CreateDefaultQuest is Script {
    // Testnet QuestManager address from your logs
    address constant QUEST_MANAGER_TESTNET = 0x02fc1eCc6c04fdd2760E74F9343b69d9c3798aD0;
    
    function run() external {
        uint256 chainId = block.chainid;
        address questManagerAddr;
        
        if (chainId == 128123) {
            // Etherlink Testnet
            questManagerAddr = QUEST_MANAGER_TESTNET;
        } else {
            revert("Unsupported chain ID");
        }
        
        console2.log("=== Creating Default Quest ===");
        console2.log("Chain ID:", chainId);
        console2.log("QuestManager address:", questManagerAddr);
        
        QuestManager questManager = QuestManager(questManagerAddr);
        
        // Check current state
        (,, uint256 totalQuests, uint256 nextQuestId,) = questManager.getConfig();
        console2.log("Current total quests:", totalQuests);
        console2.log("Next quest ID:", nextQuestId);
        
        vm.startBroadcast();
        
        // Create default quest if it doesn't exist
        if (totalQuests == 0) {
            questManager.createDefaultQuest();
            console2.log("Default quest created successfully!");
        } else {
            console2.log("Default quest already exists");
        }
        
        vm.stopBroadcast();
        
        // Verify creation
        (,, uint256 newTotalQuests,,) = questManager.getConfig();
        uint256 defaultQuestId = questManager.getDefaultQuestId();
        console2.log("New total quests:", newTotalQuests);
        console2.log("Default quest ID:", defaultQuestId);
        
        // Get quest details if quest exists
        if (newTotalQuests > 0) {
            console2.log("Quest 1 created and active!");
        } else {
            console2.log("Quest 1 does not exist");
        }
        
        console2.log("=========================");
    }
}