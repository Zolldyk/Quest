// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============ Imports ============
import {Test, console2} from "../../lib/forge-std/src/Test.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title StakingPoolTest
 * @author Quest Team
 * @notice Comprehensive tests for StakingPool contract
 * @dev Tests all functionality including staking, unstaking, rewards, and admin functions
 */
contract StakingPoolTest is Test {
    // ============ Test contracts ============
    StakingPool public stakingPool;
    MockERC20 public mockUSDC;

    // ============ Test users ============
    address public owner = makeAddr("owner");
    address public questManager = makeAddr("questManager");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public rewardRecipient = makeAddr("rewardRecipient");

    // ============ Test constants ============
    uint256 public constant INITIAL_USDC_SUPPLY = 1_000_000e6; // 1M USDC
    uint256 public constant MIN_STAKE_AMOUNT = 1e6; // 1 USDC
    uint256 public constant LARGE_STAKE_AMOUNT = 1000e6; // 1000 USDC
    uint256 public constant SMALL_STAKE_AMOUNT = 5e6; // 5 USDC

    // ============ Events (for testing) ============
    event Staked(address indexed staker, uint256 amount, uint256 newStakeAmount, uint256 newPoolBalance);
    event Unstaked(address indexed staker, uint256 amount, uint256 remainingStakeAmount, uint256 newPoolBalance);
    event RewardDistributed(address indexed recipient, uint256 amount, uint256 newPoolBalance);
    event QuestManagerSet(address indexed oldManager, address indexed newManager);
    event MinimumStakeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event EmergencyWithdrawInitiated(uint256 timestamp, uint256 delay);
    event EmergencyWithdraw(address indexed recipient, uint256 amount);
    event PoolReplenished(address indexed contributor, uint256 amount, uint256 newPoolBalance);

    // ============ Setup ============
    function setUp() public {
        // Deploy mock USDC token
        mockUSDC = new MockERC20("Mock USDC", "USDC", 6);

        // Deploy staking pool as owner
        vm.prank(owner);
        stakingPool = new StakingPool(address(mockUSDC));

        // Setup initial token balances
        mockUSDC.mint(alice, INITIAL_USDC_SUPPLY);
        mockUSDC.mint(bob, INITIAL_USDC_SUPPLY);
        mockUSDC.mint(charlie, INITIAL_USDC_SUPPLY);

        // Set quest manager
        vm.prank(owner);
        stakingPool.setQuestManager(questManager);

        // Unpause for testing
        vm.prank(owner);
        stakingPool.unpause();

        console2.log("=== Test Setup Complete ===");
        console2.log("StakingPool address:", address(stakingPool));
        console2.log("Mock USDC address:", address(mockUSDC));
        console2.log("Alice balance:", mockUSDC.balanceOf(alice) / 1e6, "USDC");
        console2.log("Bob balance:", mockUSDC.balanceOf(bob) / 1e6, "USDC");
    }

    // ============ Constructor Tests ============
    function test_Constructor() public view {
        assertEq(stakingPool.owner(), owner);
        assertEq(address(stakingPool.getStakingToken()), address(mockUSDC));
        assertEq(stakingPool.getQuestManager(), questManager);
        assertTrue(stakingPool.paused() == false); // We unpaused in setUp

        (,, uint256 totalRewards, uint256 minStake) = stakingPool.getPoolStats();
        assertEq(totalRewards, 0);
        assertEq(minStake, MIN_STAKE_AMOUNT);
    }

    function test_ConstructorRevert_ZeroAddress() public {
        vm.expectRevert(StakingPool.StakingPool__InvalidAddress.selector);
        new StakingPool(address(0));
    }

    // ============ Staking Tests ============
    function test_Stake_Success() public {
        uint256 stakeAmount = SMALL_STAKE_AMOUNT;

        // Alice approves and stakes
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);

        vm.expectEmit(true, true, true, true);
        emit Staked(alice, stakeAmount, stakeAmount, stakeAmount);

        stakingPool.stake(stakeAmount);
        vm.stopPrank();

        // Verify state
        (uint256 stakedAmount, uint256 stakeTime, uint256 lastUpdate, bool isActive) = stakingPool.getStakerInfo(alice);

        assertEq(stakedAmount, stakeAmount);
        assertEq(stakeTime, block.timestamp);
        assertEq(lastUpdate, block.timestamp);
        assertTrue(isActive);
        assertEq(stakingPool.getPoolBalance(), stakeAmount);
        assertEq(mockUSDC.balanceOf(address(stakingPool)), stakeAmount);
    }

    function test_Stake_Multiple() public {
        uint256 firstStake = SMALL_STAKE_AMOUNT;
        uint256 secondStake = MIN_STAKE_AMOUNT;

        // Alice stakes twice
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), firstStake + secondStake);

        stakingPool.stake(firstStake);
        stakingPool.stake(secondStake);
        vm.stopPrank();

        // Verify accumulated stake
        (uint256 stakedAmount,,,) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, firstStake + secondStake);
        assertEq(stakingPool.getPoolBalance(), firstStake + secondStake);
    }

    function test_Stake_MultipleUsers() public {
        uint256 aliceStake = SMALL_STAKE_AMOUNT;
        uint256 bobStake = LARGE_STAKE_AMOUNT;

        // Alice stakes
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), aliceStake);
        stakingPool.stake(aliceStake);
        vm.stopPrank();

        // Bob stakes
        vm.startPrank(bob);
        mockUSDC.approve(address(stakingPool), bobStake);
        stakingPool.stake(bobStake);
        vm.stopPrank();

        // Verify individual stakes
        (uint256 aliceStakedAmount,,,) = stakingPool.getStakerInfo(alice);
        (uint256 bobStakedAmount,,,) = stakingPool.getStakerInfo(bob);

        assertEq(aliceStakedAmount, aliceStake);
        assertEq(bobStakedAmount, bobStake);
        assertEq(stakingPool.getPoolBalance(), aliceStake + bobStake);

        // Check pool stats
        (uint256 poolBalance, uint256 totalStakers,,) = stakingPool.getPoolStats();
        assertEq(poolBalance, aliceStake + bobStake);
        assertEq(totalStakers, 2);
    }

    function test_StakeRevert_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(StakingPool.StakingPool__ZeroAmount.selector);
        stakingPool.stake(0);
    }

    function test_StakeRevert_BelowMinimum() public {
        uint256 belowMinAmount = MIN_STAKE_AMOUNT - 1;

        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), belowMinAmount);

        vm.expectRevert(StakingPool.StakingPool__InvalidAmount.selector);
        stakingPool.stake(belowMinAmount);
        vm.stopPrank();
    }

    function test_StakeRevert_InsufficientBalance() public {
        uint256 excessiveAmount = INITIAL_USDC_SUPPLY + 1;

        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), excessiveAmount);

        vm.expectRevert(
            abi.encodeWithSelector(
                StakingPool.StakingPool__InsufficientBalance.selector, INITIAL_USDC_SUPPLY, excessiveAmount
            )
        );
        stakingPool.stake(excessiveAmount);
        vm.stopPrank();
    }

    function test_StakeRevert_InsufficientAllowance() public {
        uint256 stakeAmount = SMALL_STAKE_AMOUNT;
        uint256 lowAllowance = stakeAmount - 1;

        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), lowAllowance);

        vm.expectRevert(
            abi.encodeWithSelector(StakingPool.StakingPool__InsufficientBalance.selector, lowAllowance, stakeAmount)
        );
        stakingPool.stake(stakeAmount);
        vm.stopPrank();
    }

    function test_StakeRevert_Paused() public {
        // Pause the contract
        vm.prank(owner);
        stakingPool.pause();

        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), MIN_STAKE_AMOUNT);

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        stakingPool.stake(MIN_STAKE_AMOUNT);
        vm.stopPrank();
    }

    // ============ Unstaking Tests ============
    function test_Unstake_Partial() public {
        uint256 stakeAmount = LARGE_STAKE_AMOUNT;
        uint256 unstakeAmount = SMALL_STAKE_AMOUNT;

        // Alice stakes first
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);

        uint256 balanceBefore = mockUSDC.balanceOf(alice);

        // Alice unstakes partially
        vm.expectEmit(true, true, true, true);
        emit Unstaked(alice, unstakeAmount, stakeAmount - unstakeAmount, stakeAmount - unstakeAmount);

        stakingPool.unstake(unstakeAmount);
        vm.stopPrank();

        // Verify state
        (uint256 stakedAmount,,,) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, stakeAmount - unstakeAmount);
        assertEq(stakingPool.getPoolBalance(), stakeAmount - unstakeAmount);
        assertEq(mockUSDC.balanceOf(alice), balanceBefore + unstakeAmount);
    }

    function test_Unstake_Full() public {
        uint256 stakeAmount = SMALL_STAKE_AMOUNT;

        // Alice stakes and then unstakes all
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);

        uint256 balanceBefore = mockUSDC.balanceOf(alice);

        stakingPool.unstake(stakeAmount);
        vm.stopPrank();

        // Verify staker is deactivated
        (uint256 stakedAmount,,, bool isActive) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, 0);
        assertFalse(isActive);
        assertEq(stakingPool.getPoolBalance(), 0);
        assertEq(mockUSDC.balanceOf(alice), balanceBefore + stakeAmount);
    }

    function test_UnstakeRevert_InsufficientStake() public {
        uint256 stakeAmount = MIN_STAKE_AMOUNT;
        uint256 unstakeAmount = stakeAmount + 1;

        // Alice stakes small amount
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);

        // Try to unstake more than staked
        vm.expectRevert(
            abi.encodeWithSelector(StakingPool.StakingPool__InsufficientBalance.selector, stakeAmount, unstakeAmount)
        );
        stakingPool.unstake(unstakeAmount);
        vm.stopPrank();
    }

    function test_UnstakeRevert_NoStake() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(StakingPool.StakingPool__InsufficientBalance.selector, 0, MIN_STAKE_AMOUNT)
        );
        stakingPool.unstake(MIN_STAKE_AMOUNT);
    }

    // ============ Reward Distribution Tests ============
    function test_DistributeReward_Success() public {
        uint256 stakeAmount = LARGE_STAKE_AMOUNT;
        uint256 rewardAmount = MIN_STAKE_AMOUNT;

        // Alice stakes to fund pool
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);
        vm.stopPrank();

        // Quest manager distributes reward
        uint256 recipientBalanceBefore = mockUSDC.balanceOf(rewardRecipient);

        vm.prank(questManager);
        vm.expectEmit(true, true, true, true);
        emit RewardDistributed(rewardRecipient, rewardAmount, stakeAmount - rewardAmount);

        stakingPool.distributeReward(rewardRecipient, rewardAmount);

        // Verify reward distribution
        assertEq(mockUSDC.balanceOf(rewardRecipient), recipientBalanceBefore + rewardAmount);
        assertEq(stakingPool.getPoolBalance(), stakeAmount - rewardAmount);

        (,, uint256 totalRewards,) = stakingPool.getPoolStats();
        assertEq(totalRewards, rewardAmount);
    }

    function test_DistributeRewardRevert_Unauthorized() public {
        vm.prank(alice);
        vm.expectRevert(StakingPool.StakingPool__Unauthorized.selector);
        stakingPool.distributeReward(rewardRecipient, MIN_STAKE_AMOUNT);
    }

    function test_DistributeRewardRevert_InsufficientPool() public {
        uint256 stakeAmount = MIN_STAKE_AMOUNT;
        uint256 excessiveReward = stakeAmount + 1;

        // Alice stakes small amount
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);
        vm.stopPrank();

        // Quest manager tries to distribute more than pool has
        vm.prank(questManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                StakingPool.StakingPool__InsufficientPoolBalance.selector, stakeAmount, excessiveReward
            )
        );
        stakingPool.distributeReward(rewardRecipient, excessiveReward);
    }

    // ============ Pool Replenishment Tests ============
    function test_ReplenishPool_Success() public {
        uint256 replenishAmount = SMALL_STAKE_AMOUNT;

        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), replenishAmount);

        vm.expectEmit(true, true, true, true);
        emit PoolReplenished(alice, replenishAmount, replenishAmount);

        stakingPool.replenishPool(replenishAmount);
        vm.stopPrank();

        assertEq(stakingPool.getPoolBalance(), replenishAmount);
        assertEq(mockUSDC.balanceOf(address(stakingPool)), replenishAmount);
    }

    function test_ReplenishPool_MultipleContributions() public {
        uint256 aliceAmount = SMALL_STAKE_AMOUNT;
        uint256 bobAmount = MIN_STAKE_AMOUNT;

        // Alice replenishes
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), aliceAmount);
        stakingPool.replenishPool(aliceAmount);
        vm.stopPrank();

        // Bob replenishes
        vm.startPrank(bob);
        mockUSDC.approve(address(stakingPool), bobAmount);
        stakingPool.replenishPool(bobAmount);
        vm.stopPrank();

        assertEq(stakingPool.getPoolBalance(), aliceAmount + bobAmount);
    }

    // ============ Admin Function Tests ============
    function test_SetQuestManager_Success() public {
        address newQuestManager = makeAddr("newQuestManager");

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit QuestManagerSet(questManager, newQuestManager);

        stakingPool.setQuestManager(newQuestManager);

        assertEq(stakingPool.getQuestManager(), newQuestManager);
    }

    function test_SetQuestManagerRevert_Unauthorized() public {
        address newQuestManager = makeAddr("newQuestManager");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(0x118cdaa7, alice)); // OwnableUnauthorizedAccount(address) selector
        stakingPool.setQuestManager(newQuestManager);
    }

    function test_SetQuestManagerRevert_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(StakingPool.StakingPool__InvalidAddress.selector);
        stakingPool.setQuestManager(address(0));
    }

    function test_SetMinimumStakeAmount_Success() public {
        uint256 newMinAmount = 2e6; // 2 USDC

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MinimumStakeAmountUpdated(MIN_STAKE_AMOUNT, newMinAmount);

        stakingPool.setMinimumStakeAmount(newMinAmount);

        (,,, uint256 minStake) = stakingPool.getPoolStats();
        assertEq(minStake, newMinAmount);
    }

    function test_SetMinimumStakeAmountRevert_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(StakingPool.StakingPool__ZeroAmount.selector);
        stakingPool.setMinimumStakeAmount(0);
    }

    function test_PauseUnpause() public {
        // Test pause
        vm.prank(owner);
        stakingPool.pause();
        assertTrue(stakingPool.paused());

        // Test unpause
        vm.prank(owner);
        stakingPool.unpause();
        assertFalse(stakingPool.paused());
    }

    function test_PauseRevert_Unauthorized() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(0x118cdaa7, alice)); // OwnableUnauthorizedAccount(address) selector
        stakingPool.pause();
    }

    // ============ Emergency Withdrawal Tests ============
    function test_EmergencyWithdraw_Success() public {
        uint256 stakeAmount = LARGE_STAKE_AMOUNT;

        // Alice stakes to have funds in pool
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);
        vm.stopPrank();

        // Owner initiates emergency withdrawal
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit EmergencyWithdrawInitiated(block.timestamp, 7 days);
        stakingPool.initiateEmergencyWithdraw();

        // Fast forward past delay
        vm.warp(block.timestamp + 7 days + 1);

        uint256 ownerBalanceBefore = mockUSDC.balanceOf(owner);

        // Execute emergency withdrawal
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit EmergencyWithdraw(owner, stakeAmount);
        stakingPool.executeEmergencyWithdraw();

        // Verify withdrawal
        assertEq(mockUSDC.balanceOf(owner), ownerBalanceBefore + stakeAmount);
        assertEq(stakingPool.getPoolBalance(), 0);

        // Check status is reset
        (bool isInitiated, bool canExecute,) = stakingPool.getEmergencyWithdrawStatus();
        assertFalse(isInitiated);
        assertFalse(canExecute);
    }

    function test_EmergencyWithdrawRevert_NotInitiated() public {
        vm.prank(owner);
        vm.expectRevert(StakingPool.StakingPool__Unauthorized.selector);
        stakingPool.executeEmergencyWithdraw();
    }

    function test_EmergencyWithdrawRevert_TooEarly() public {
        // Initiate emergency withdrawal
        vm.prank(owner);
        stakingPool.initiateEmergencyWithdraw();

        // Try to execute immediately (should fail)
        vm.prank(owner);
        vm.expectRevert(StakingPool.StakingPool__Unauthorized.selector);
        stakingPool.executeEmergencyWithdraw();
    }

    function test_EmergencyWithdrawStatus() public {
        // Initially not initiated
        (bool isInitiated, bool canExecute, uint256 timeRemaining) = stakingPool.getEmergencyWithdrawStatus();
        assertFalse(isInitiated);
        assertFalse(canExecute);
        assertEq(timeRemaining, 0);

        // After initiation
        vm.prank(owner);
        stakingPool.initiateEmergencyWithdraw();

        (isInitiated, canExecute, timeRemaining) = stakingPool.getEmergencyWithdrawStatus();
        assertTrue(isInitiated);
        assertFalse(canExecute);
        assertEq(timeRemaining, 7 days);

        // After delay passes
        vm.warp(block.timestamp + 7 days + 1);
        (isInitiated, canExecute, timeRemaining) = stakingPool.getEmergencyWithdrawStatus();
        assertTrue(isInitiated);
        assertTrue(canExecute);
        assertEq(timeRemaining, 0);
    }

    // ============ View Function Tests ============
    function test_GetPoolBalance() public {
        assertEq(stakingPool.getPoolBalance(), 0);

        // Alice stakes
        uint256 stakeAmount = SMALL_STAKE_AMOUNT;
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);
        vm.stopPrank();

        assertEq(stakingPool.getPoolBalance(), stakeAmount);
    }

    function test_GetStakerInfo() public {
        // Before staking
        (uint256 stakedAmount, uint256 stakeTime, uint256 lastUpdate, bool isActive) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, 0);
        assertEq(stakeTime, 0);
        assertEq(lastUpdate, 0);
        assertFalse(isActive);

        // After staking
        uint256 stakeAmount = SMALL_STAKE_AMOUNT;
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);
        vm.stopPrank();

        (stakedAmount, stakeTime, lastUpdate, isActive) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, stakeAmount);
        assertEq(stakeTime, block.timestamp);
        assertEq(lastUpdate, block.timestamp);
        assertTrue(isActive);
    }

    function test_GetPoolStats() public {
        // Initial state
        (uint256 poolBalance, uint256 totalStakers, uint256 totalRewards, uint256 minStake) = stakingPool.getPoolStats();
        assertEq(poolBalance, 0);
        assertEq(totalStakers, 0);
        assertEq(totalRewards, 0);
        assertEq(minStake, MIN_STAKE_AMOUNT);

        // After Alice stakes
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), SMALL_STAKE_AMOUNT);
        stakingPool.stake(SMALL_STAKE_AMOUNT);
        vm.stopPrank();

        (poolBalance, totalStakers, totalRewards, minStake) = stakingPool.getPoolStats();
        assertEq(poolBalance, SMALL_STAKE_AMOUNT);
        assertEq(totalStakers, 1);
        assertEq(totalRewards, 0);

        // After Bob stakes
        vm.startPrank(bob);
        mockUSDC.approve(address(stakingPool), LARGE_STAKE_AMOUNT);
        stakingPool.stake(LARGE_STAKE_AMOUNT);
        vm.stopPrank();

        (poolBalance, totalStakers,,) = stakingPool.getPoolStats();
        assertEq(poolBalance, SMALL_STAKE_AMOUNT + LARGE_STAKE_AMOUNT);
        assertEq(totalStakers, 2);
    }

    function test_GetConfig() public view {
        (
            address stakingToken,
            address questManagerAddr,
            uint256 minimumStakeAmount,
            uint256 emergencyWithdrawDelay,
            bool isPaused
        ) = stakingPool.getConfig();

        assertEq(stakingToken, address(mockUSDC));
        assertEq(questManagerAddr, questManager);
        assertEq(minimumStakeAmount, MIN_STAKE_AMOUNT);
        assertEq(emergencyWithdrawDelay, 7 days);
        assertFalse(isPaused);
    }

    // ============ Fuzz Tests ============
    function testFuzz_Stake(uint256 amount) public {
        // Bound amount to reasonable range
        amount = bound(amount, MIN_STAKE_AMOUNT, INITIAL_USDC_SUPPLY);

        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), amount);
        stakingPool.stake(amount);
        vm.stopPrank();

        (uint256 stakedAmount,,,) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, amount);
        assertEq(stakingPool.getPoolBalance(), amount);
    }

    function testFuzz_StakeAndUnstake(uint256 stakeAmount, uint256 unstakeAmount) public {
        // Bound amounts
        stakeAmount = bound(stakeAmount, MIN_STAKE_AMOUNT, INITIAL_USDC_SUPPLY);
        unstakeAmount = bound(unstakeAmount, 1, stakeAmount);

        // Stake
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), stakeAmount);
        stakingPool.stake(stakeAmount);

        // Unstake
        stakingPool.unstake(unstakeAmount);
        vm.stopPrank();

        (uint256 remainingStake,,,) = stakingPool.getStakerInfo(alice);
        assertEq(remainingStake, stakeAmount - unstakeAmount);
        assertEq(stakingPool.getPoolBalance(), stakeAmount - unstakeAmount);
    }

    // ============ Integration Tests ============
    function test_Integration_FullWorkflow() public {
        console2.log("=== Integration Test: Full Staking Workflow ===");

        uint256 aliceStake = 100e6; // 100 USDC
        uint256 bobStake = 50e6; // 50 USDC
        uint256 reward = 10e6; // 10 USDC

        // Phase 1: Initial staking
        console2.log("Phase 1: Alice and Bob stake");
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), aliceStake);
        stakingPool.stake(aliceStake);
        vm.stopPrank();

        vm.startPrank(bob);
        mockUSDC.approve(address(stakingPool), bobStake);
        stakingPool.stake(bobStake);
        vm.stopPrank();

        uint256 totalPoolBalance = aliceStake + bobStake;
        assertEq(stakingPool.getPoolBalance(), totalPoolBalance);
        console2.log("Total pool balance:", totalPoolBalance / 1e6, "USDC");

        // Phase 2: Reward distribution
        console2.log("Phase 2: Distribute reward");
        vm.prank(questManager);
        stakingPool.distributeReward(rewardRecipient, reward);

        assertEq(mockUSDC.balanceOf(rewardRecipient), reward);
        assertEq(stakingPool.getPoolBalance(), totalPoolBalance - reward);
        console2.log("Reward distributed:", reward / 1e6, "USDC");
        console2.log("Remaining pool:", stakingPool.getPoolBalance() / 1e6, "USDC");

        // Phase 3: Partial unstaking
        console2.log("Phase 3: Alice partially unstakes");
        uint256 aliceUnstake = 30e6; // 30 USDC
        vm.prank(alice);
        stakingPool.unstake(aliceUnstake);

        (uint256 aliceRemaining,,,) = stakingPool.getStakerInfo(alice);
        assertEq(aliceRemaining, aliceStake - aliceUnstake);
        console2.log("Alice remaining stake:", aliceRemaining / 1e6, "USDC");

        // Phase 4: Pool replenishment
        console2.log("Phase 4: Charlie replenishes pool");
        uint256 replenish = 25e6; // 25 USDC
        vm.startPrank(charlie);
        mockUSDC.approve(address(stakingPool), replenish);
        stakingPool.replenishPool(replenish);
        vm.stopPrank();

        uint256 finalPoolBalance = totalPoolBalance - reward - aliceUnstake + replenish;
        assertEq(stakingPool.getPoolBalance(), finalPoolBalance);
        console2.log("Final pool balance:", finalPoolBalance / 1e6, "USDC");

        // Verify final state
        (uint256 poolBalance, uint256 totalStakers, uint256 totalRewards,) = stakingPool.getPoolStats();
        assertEq(poolBalance, finalPoolBalance);
        assertEq(totalStakers, 2); // Alice and Bob are still stakers
        assertEq(totalRewards, reward);

        console2.log("Integration test completed successfully!");
    }

    // ============ Gas Tests ============
    function test_Gas_Stake() public {
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), MIN_STAKE_AMOUNT);

        uint256 gasBefore = gasleft();
        stakingPool.stake(MIN_STAKE_AMOUNT);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("Gas used for stake:", gasUsed);
        vm.stopPrank();

        // Ensure gas usage is reasonable (should be under 250k gas with via_ir)
        assertLt(gasUsed, 250000);
    }

    function test_Gas_Unstake() public {
        // Setup: Alice stakes first
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), MIN_STAKE_AMOUNT);
        stakingPool.stake(MIN_STAKE_AMOUNT);

        uint256 gasBefore = gasleft();
        stakingPool.unstake(MIN_STAKE_AMOUNT);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("Gas used for unstake:", gasUsed);
        vm.stopPrank();

        // Ensure gas usage is reasonable
        assertLt(gasUsed, 80000);
    }

    function test_Gas_DistributeReward() public {
        // Setup: Alice stakes to fund pool
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), LARGE_STAKE_AMOUNT);
        stakingPool.stake(LARGE_STAKE_AMOUNT);
        vm.stopPrank();

        vm.prank(questManager);
        uint256 gasBefore = gasleft();
        stakingPool.distributeReward(rewardRecipient, MIN_STAKE_AMOUNT);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("Gas used for distribute reward:", gasUsed);

        // Ensure gas usage is reasonable
        assertLt(gasUsed, 70000);
    }
}
