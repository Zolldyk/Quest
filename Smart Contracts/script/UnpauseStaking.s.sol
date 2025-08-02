// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { StakingPool } from "../src/StakingPool.sol";

/**
 * @title UnpauseStaking
 * @notice Script to unpause the StakingPool contract
 */
contract UnpauseStaking is Script {
    // StakingPool address on Etherlink testnet
    address constant STAKING_POOL_ADDRESS = 0x4f910ef3996d7C4763EFA2fEf15265e8b918cD0b;

    function run() external {
        console2.log("=== Unpausing StakingPool ===");
        console2.log("StakingPool address:", STAKING_POOL_ADDRESS);
        console2.log("Sender:", msg.sender);

        // Get the StakingPool instance
        StakingPool stakingPool = StakingPool(STAKING_POOL_ADDRESS);

        // Check current pause state
        bool isPaused = stakingPool.paused();
        console2.log("Current paused state:", isPaused);

        if (!isPaused) {
            console2.log("Contract is already unpaused!");
            return;
        }

        // Start broadcasting transactions
        vm.startBroadcast();

        // Unpause the contract
        stakingPool.unpause();
        console2.log("StakingPool unpaused successfully!");

        vm.stopBroadcast();

        // Verify the state changed
        bool newPausedState = stakingPool.paused();
        console2.log("New paused state:", newPausedState);
        
        if (!newPausedState) {
            console2.log("Success: StakingPool is now active and ready for staking!");
        } else {
            console2.log("Error: Contract is still paused");
        }
    }
}