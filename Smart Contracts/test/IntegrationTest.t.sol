// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============ Imports ============
import {Test, console2} from "forge-std/Test.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {QuestManager} from "../src/QuestManager.sol";
import {NFTMinter} from "../src/NFTMinter.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title IntegrationTest
 * @author Quest Team
 * @notice End-to-end integration tests for the complete Quest DApp
 * @dev Tests the full user journey from deployment to quest completion
 */
contract IntegrationTest is Test {
    // ============ Test Contracts ============
    StakingPool public stakingPool;
    QuestManager public questManager;
    NFTMinter public nftMinter;
    MockERC20 public mockUSDC;

    // ============ Test Users ============
    address public deployer = makeAddr("deployer");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public admin = makeAddr("admin");

    // ============ Test Constants ============
    uint256 public constant INITIAL_USDC_SUPPLY = 1_000_000e6; // 1M USDC
    uint256 public constant STAKE_AMOUNT = 100e6; // 100 USDC
    uint256 public constant REWARD_AMOUNT = 1e6; // 1 USDC
    string public constant QUEST_DESCRIPTION = "Post a tweet about #EtherlinkQuest";
    string public constant TWEET_URL = "https://twitter.com/user/status/123456789";

    // ============ Setup ============
    function setUp() public {
        console2.log("Setting up Integration Tests...");

        // Deploy mock USDC first
        mockUSDC = new MockERC20("USD Coin", "USDC", 6);
        console2.log("Mock USDC deployed");

        // Setup deployer with ETH
        vm.deal(deployer, 100 ether);

        // Deploy all contracts directly for testing
        vm.startPrank(deployer);
        
        // Deploy StakingPool
        stakingPool = new StakingPool(
            address(mockUSDC) // stakingToken
        );
        
        // Deploy NFTMinter
        nftMinter = new NFTMinter();
        
        // Deploy QuestManager
        questManager = new QuestManager(
            address(stakingPool), // stakingPool
            deployer             // initialOwner
        );
        
        // Configure contracts
        stakingPool.setQuestManager(address(questManager));
        nftMinter.setQuestManager(address(questManager));
        questManager.setNFTMinter(address(nftMinter));
        
        // Grant admin role to deployer for quest management
        questManager.addAdmin(deployer);
        
        // Unpause staking pool for testing
        stakingPool.unpause();
        
        vm.stopPrank();

        // Setup test users with USDC
        _setupTestUsers();

        // Fund staking pool for rewards
        _fundStakingPool();

        console2.log("Integration test setup complete");
    }

    // ============ Test Helper Functions ============
    
    /**
     * @notice Get staker info for testing
     */
    function _getStakerInfo(address staker) internal view returns (uint256 stakedAmount, uint256 stakeTimestamp, uint256 lastUpdateTime, bool isActive) {
        (stakedAmount, stakeTimestamp, lastUpdateTime, isActive) = stakingPool.getStakerInfo(staker);
    }

    /**
     * @notice Setup test users with initial USDC balances
     */
    function _setupTestUsers() internal {
        // Give users initial USDC balances
        mockUSDC.mint(alice, INITIAL_USDC_SUPPLY);
        mockUSDC.mint(bob, INITIAL_USDC_SUPPLY);
        mockUSDC.mint(admin, INITIAL_USDC_SUPPLY);
        
        console2.log("Test users funded with USDC");
    }

    /**
     * @notice Fund the staking pool with initial liquidity for rewards
     */
    function _fundStakingPool() internal {
        // Fund the staking pool with initial USDC for rewards
        vm.startPrank(deployer);
        mockUSDC.mint(deployer, 1000e6); // 1000 USDC for rewards
        mockUSDC.approve(address(stakingPool), 1000e6);
        stakingPool.stake(1000e6);
        vm.stopPrank();
        
        console2.log("Staking pool funded with rewards");
    }

    // ============ End-to-End Test Scenarios ============

    /**
     * @notice Test complete user journey: stake → submit quest → complete quest → claim rewards
     */
    function test_CompleteUserJourney() public {
        console2.log("Testing complete user journey...");

        // ============ Phase 1: User Stakes USDC ============
        vm.startPrank(alice);
        
        // Approve and stake USDC
        mockUSDC.approve(address(stakingPool), STAKE_AMOUNT);
        stakingPool.stake(STAKE_AMOUNT);
        
        // Verify staking
        (uint256 stakedAmount,,,) = stakingPool.getStakerInfo(alice);
        assertEq(stakedAmount, STAKE_AMOUNT);
        assertEq(stakingPool.getPoolBalance(), STAKE_AMOUNT + 1000e6); // Including pre-funded rewards
        console2.log("Phase 1: Alice staked", STAKE_AMOUNT, "USDC");

        vm.stopPrank();

        // ============ Phase 2: Admin Creates Quest ============
        vm.startPrank(deployer);
        
        questManager.createQuest(
            "Test Quest",
            QUEST_DESCRIPTION,
            "Post about #EtherlinkQuest and tag @etherlink",
            REWARD_AMOUNT,
            7 days,     // duration
            100         // maxCompletions
        );
        
        // Verify quest creation
        QuestManager.Quest memory quest = questManager.getQuest(1);
        assertEq(quest.title, "Test Quest");
        assertEq(quest.description, QUEST_DESCRIPTION);
        assertEq(quest.rewardAmount, REWARD_AMOUNT);
        assertTrue(quest.isActive);
        console2.log("Phase 2: Quest created with", quest.rewardAmount, "USDC reward");

        vm.stopPrank();

        // ============ Phase 3: User Submits Quest ============
        vm.startPrank(alice);
        
        questManager.submitQuest(1, TWEET_URL);
        
        // Verify submission
        QuestManager.QuestSubmission memory submission = questManager.getSubmission(1);
        assertEq(submission.player, alice);
        assertEq(submission.questId, 1);
        assertEq(submission.tweetUrl, TWEET_URL);
        assertTrue(uint8(submission.status) == 0); // PENDING
        console2.log("Phase 3: Alice submitted quest with URL:", TWEET_URL);

        vm.stopPrank();

        // ============ Phase 4: Admin Verifies and Completes Quest ============
        vm.startPrank(deployer);
        
        uint256 aliceBalanceBefore = mockUSDC.balanceOf(alice);
        uint256 poolBalanceBefore = stakingPool.getPoolBalance();
        
        questManager.verifyQuest(1, true, "");
        
        // Verify quest completion and reward distribution
        QuestManager.QuestSubmission memory completedSubmission = questManager.getSubmission(1);
        assertTrue(uint8(completedSubmission.status) == 1); // COMPLETED
        
        uint256 aliceBalanceAfter = mockUSDC.balanceOf(alice);
        uint256 poolBalanceAfter = stakingPool.getPoolBalance();
        
        assertEq(aliceBalanceAfter - aliceBalanceBefore, REWARD_AMOUNT);
        assertEq(poolBalanceBefore - poolBalanceAfter, REWARD_AMOUNT);
        console2.log("Phase 4: Quest completed, Alice received", REWARD_AMOUNT, "USDC reward");

        vm.stopPrank();

        // ============ Phase 5: Verify NFT Minting ============
        // Check if Alice received an NFT badge
        uint256 aliceNFTBalance = nftMinter.balanceOf(alice);
        assertEq(aliceNFTBalance, 1);
        
        // Verify NFT metadata
        uint256[] memory userBadges = nftMinter.getUserBadges(alice);
        assertTrue(userBadges.length > 0);
        uint256 tokenId = userBadges[0];
        string memory tokenURI = nftMinter.tokenURI(tokenId);
        assertTrue(bytes(tokenURI).length > 0);
        console2.log("Phase 5: Alice received NFT badge with token ID:", tokenId);

        // ============ Phase 6: User Unstakes ============
        vm.startPrank(alice);
        
        uint256 aliceUSDCBeforeUnstake = mockUSDC.balanceOf(alice);
        stakingPool.unstake(STAKE_AMOUNT);
        uint256 aliceUSDCAfterUnstake = mockUSDC.balanceOf(alice);
        
        // Verify unstaking
        (uint256 remainingStake,,,) = stakingPool.getStakerInfo(alice);
        assertEq(remainingStake, 0);
        assertEq(aliceUSDCAfterUnstake - aliceUSDCBeforeUnstake, STAKE_AMOUNT);
        console2.log("Phase 6: Alice unstaked", STAKE_AMOUNT, "USDC");

        vm.stopPrank();

        console2.log("Complete user journey test passed!");
    }

    /**
     * @notice Test multiple users with concurrent quests
     */
    function test_MultipleUsersScenario() public {
        console2.log("Testing multiple users scenario...");

        // Both users stake
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), STAKE_AMOUNT);
        stakingPool.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.startPrank(bob);
        mockUSDC.approve(address(stakingPool), STAKE_AMOUNT);
        stakingPool.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // Admin creates quest
        vm.startPrank(deployer);
        questManager.createQuest(
            "Multi-User Quest",
            QUEST_DESCRIPTION,
            "Complete the quest requirements",
            REWARD_AMOUNT,
            7 days,     // duration
            100         // maxCompletions
        );
        vm.stopPrank();

        // Both users submit quest
        vm.startPrank(alice);
        questManager.submitQuest(1, "https://twitter.com/alice/status/123");
        vm.stopPrank();

        vm.startPrank(bob);
        questManager.submitQuest(1, "https://twitter.com/bob/status/456");
        vm.stopPrank();

        // Admin verifies both submissions
        vm.startPrank(deployer);
        questManager.verifyQuest(1, true, ""); // Alice's submission
        questManager.verifyQuest(2, true, ""); // Bob's submission
        vm.stopPrank();

        // Verify both users received rewards and NFTs
        assertEq(nftMinter.balanceOf(alice), 1);
        assertEq(nftMinter.balanceOf(bob), 1);
        console2.log("Multiple users scenario passed!");
    }

    /**
     * @notice Test quest rejection scenario
     */
    function test_QuestRejectionScenario() public {
        console2.log("Testing quest rejection scenario...");

        // User stakes
        vm.startPrank(alice);
        mockUSDC.approve(address(stakingPool), STAKE_AMOUNT);
        stakingPool.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // Admin creates quest
        vm.startPrank(deployer);
        questManager.createQuest(
            "Rejection Test Quest",
            "Post about our project",
            "Requirements for posting",
            REWARD_AMOUNT,
            7 days,     // duration
            100         // maxCompletions
        );
        vm.stopPrank();

        // User submits quest
        vm.startPrank(alice);
        questManager.submitQuest(1, "https://twitter.com/alice/invalid");
        vm.stopPrank();

        // Admin rejects submission
        vm.startPrank(deployer);
        questManager.verifyQuest(1, false, "Post does not meet requirements");
        vm.stopPrank();

        // Verify rejection
        QuestManager.QuestSubmission memory rejectedSubmission = questManager.getSubmission(1);
        assertTrue(uint8(rejectedSubmission.status) == 2); // REJECTED
        assertEq(rejectedSubmission.rejectionReason, "Post does not meet requirements");
        
        // Verify no NFT was minted
        assertEq(nftMinter.balanceOf(alice), 0);
        console2.log("Quest rejection scenario passed!");
    }
}