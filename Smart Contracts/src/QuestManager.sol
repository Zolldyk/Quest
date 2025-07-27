// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============ Imports ============
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

// Note: Interfaces removed to fix abstract contract error
// We'll use low-level calls or cast addresses when needed

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

/**
 * @title QuestManager
 * @author Quest Team
 * @notice This contract manages quest submissions, verification, and reward distribution
 * @dev Handles the core quest logic with admin verification and automatic reward distribution
 */
contract QuestManager is Ownable, Pausable, ReentrancyGuard {
    // ============ Errors ============
    error QuestManager__InvalidAddress();
    error QuestManager__InvalidAmount();
    error QuestManager__QuestNotFound();
    error QuestManager__QuestAlreadySubmitted();
    error QuestManager__QuestNotSubmitted();
    error QuestManager__QuestAlreadyCompleted();
    error QuestManager__QuestAlreadyRejected();
    error QuestManager__Unauthorized();
    error QuestManager__EmptyTweetUrl();
    error QuestManager__InvalidQuestId();
    error QuestManager__InsufficientPoolBalance();
    error QuestManager__QuestNotActive();
    error QuestManager__SubmissionWindowClosed();
    error QuestManager__PlayerAlreadyCompleted();

    // ============ Type declarations ============
    enum QuestStatus {
        PENDING, // Quest submitted, waiting for verification
        COMPLETED, // Quest verified and reward distributed
        REJECTED // Quest rejected by admin

    }

    struct Quest {
        uint256 questId; // Unique quest identifier
        string title; // Quest title
        string description; // Quest description
        string requirements; // What needs to be done
        uint256 rewardAmount; // Reward in USDC (6 decimals)
        bool isActive; // Whether quest accepts new submissions
        uint256 startTime; // When quest becomes available
        uint256 endTime; // When quest closes for submissions
        uint256 maxCompletions; // Maximum number of completions allowed
        uint256 currentCompletions; // Current number of completed submissions
        address creator; // Who created the quest
        uint256 createTime; // When quest was created
    }

    struct QuestSubmission {
        uint256 questId; // Which quest this is for
        address player; // Who submitted
        string tweetUrl; // Proof of completion (tweet URL)
        uint256 submitTime; // When submitted
        QuestStatus status; // Current status
        uint256 verifyTime; // When verified/rejected
        address verifiedBy; // Admin who verified
        uint256 nftTokenId; // NFT token ID if minted
        string rejectionReason; // Reason for rejection if applicable
    }

    // ============ State variables ============
    // Contract dependencies
    address private immutable i_stakingPool;
    address private s_nftMinter;

    // Quest tracking
    uint256 private s_nextQuestId = 1;
    uint256 private s_totalQuests = 0;
    uint256 private s_totalSubmissions = 0;
    uint256 private s_totalCompletedQuests = 0;

    // Quest storage
    mapping(uint256 => Quest) private s_quests;
    mapping(uint256 => QuestSubmission) private s_submissions;
    mapping(address => mapping(uint256 => bool)) private s_playerCompletedQuest; // player => questId => completed
    mapping(address => uint256[]) private s_playerSubmissions; // player => submission IDs
    mapping(uint256 => uint256[]) private s_questSubmissions; // questId => submission IDs

    // Admin management
    mapping(address => bool) private s_admins;
    uint256 private s_adminCount = 0;

    // Configuration
    uint256 private constant DEFAULT_QUEST_DURATION = 7 days;
    uint256 private constant DEFAULT_REWARD_AMOUNT = 1e6; // 1 USDC
    uint256 private constant MAX_TWEET_URL_LENGTH = 500;
    uint256 private s_nextSubmissionId = 1;

    // ============ Events ============
    event QuestCreated(
        uint256 indexed questId,
        string title,
        uint256 rewardAmount,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );
    event QuestSubmitted(
        uint256 indexed submissionId,
        uint256 indexed questId,
        address indexed player,
        string tweetUrl,
        uint256 submitTime
    );
    event QuestVerified(
        uint256 indexed submissionId,
        uint256 indexed questId,
        address indexed player,
        QuestStatus status,
        address verifiedBy,
        uint256 nftTokenId
    );
    event QuestRejected(
        uint256 indexed submissionId, uint256 indexed questId, address indexed player, string reason, address verifiedBy
    );
    event RewardDistributed(
        uint256 indexed submissionId, uint256 indexed questId, address indexed player, uint256 amount
    );
    event AdminAdded(address indexed admin, address indexed addedBy);
    event AdminRemoved(address indexed admin, address indexed removedBy);
    event NFTMinterSet(address indexed oldMinter, address indexed newMinter);
    event QuestStatusUpdated(uint256 indexed questId, bool isActive);

    // ============ Modifiers ============
    /**
     * @notice Modifier to restrict access to admins only
     */
    modifier onlyAdmin() {
        if (!s_admins[msg.sender] && msg.sender != owner()) {
            revert QuestManager__Unauthorized();
        }
        _;
    }

    /**
     * @notice Modifier to check for valid addresses
     */
    modifier validAddress(address _address) {
        if (_address == address(0)) {
            revert QuestManager__InvalidAddress();
        }
        _;
    }

    /**
     * @notice Modifier to validate quest exists
     */
    modifier questExists(uint256 questId) {
        if (questId == 0 || questId >= s_nextQuestId) {
            revert QuestManager__QuestNotFound();
        }
        _;
    }

    /**
     * @notice Modifier to validate submission exists
     */
    modifier submissionExists(uint256 submissionId) {
        if (submissionId == 0 || submissionId >= s_nextSubmissionId) {
            revert QuestManager__QuestNotFound();
        }
        _;
    }

    // ============ Constructor ============
    /**
     * @notice Initialize the quest manager with staking pool reference
     * @param stakingPool Address of the staking pool contract
     * @param initialOwner Address to set as the contract owner
     * @dev Sets the contract owner as the first admin
     */
    constructor(address stakingPool, address initialOwner) 
        validAddress(stakingPool) 
        validAddress(initialOwner)
        Ownable(initialOwner) 
    {
        i_stakingPool = stakingPool;

        // Set owner as first admin
        s_admins[initialOwner] = true;
        s_adminCount = 1;
    }

    // ============ External Functions ============
    /**
     * @notice Submit a quest for completion verification
     * @param questId ID of the quest being submitted
     * @param tweetUrl URL of the tweet proving quest completion
     * @dev Players can only submit once per quest
     */
    function submitQuest(uint256 questId, string calldata tweetUrl)
        external
        nonReentrant
        whenNotPaused
        questExists(questId)
    {
        // Validate tweet URL
        bytes memory tweetBytes = bytes(tweetUrl);
        if (tweetBytes.length == 0) {
            revert QuestManager__EmptyTweetUrl();
        }
        if (tweetBytes.length > MAX_TWEET_URL_LENGTH) {
            revert QuestManager__EmptyTweetUrl();
        }

        // Get quest details
        Quest storage quest = s_quests[questId];

        // Check if quest is active
        if (!quest.isActive) {
            revert QuestManager__QuestNotActive();
        }

        // Check if quest is within submission window
        if (block.timestamp < quest.startTime || block.timestamp > quest.endTime) {
            revert QuestManager__SubmissionWindowClosed();
        }

        // Check if max completions reached
        if (quest.currentCompletions >= quest.maxCompletions) {
            revert QuestManager__SubmissionWindowClosed();
        }

        // Check if player already completed this quest
        if (s_playerCompletedQuest[msg.sender][questId]) {
            revert QuestManager__PlayerAlreadyCompleted();
        }

        // Check if player already has a pending submission for this quest
        uint256[] memory playerSubs = s_playerSubmissions[msg.sender];
        for (uint256 i = 0; i < playerSubs.length; i++) {
            QuestSubmission storage existingSub = s_submissions[playerSubs[i]];
            if (existingSub.questId == questId && existingSub.status == QuestStatus.PENDING) {
                revert QuestManager__QuestAlreadySubmitted();
            }
        }

        // Create new submission
        uint256 submissionId = s_nextSubmissionId++;
        QuestSubmission storage submission = s_submissions[submissionId];

        submission.questId = questId;
        submission.player = msg.sender;
        submission.tweetUrl = tweetUrl;
        submission.submitTime = block.timestamp;
        submission.status = QuestStatus.PENDING;

        // Update tracking mappings
        s_playerSubmissions[msg.sender].push(submissionId);
        s_questSubmissions[questId].push(submissionId);
        s_totalSubmissions++;

        emit QuestSubmitted(submissionId, questId, msg.sender, tweetUrl, block.timestamp);
    }

    /**
     * @notice Verify a quest submission and distribute rewards
     * @param submissionId ID of the submission to verify
     * @param approved Whether the submission is approved or rejected
     * @param rejectionReason Reason for rejection (if applicable)
     * @dev Only admins can verify quests
     */
    function verifyQuest(uint256 submissionId, bool approved, string calldata rejectionReason)
        external
        nonReentrant
        onlyAdmin
        submissionExists(submissionId)
    {
        QuestSubmission storage submission = s_submissions[submissionId];

        // Check if submission is still pending
        if (submission.status != QuestStatus.PENDING) {
            if (submission.status == QuestStatus.COMPLETED) {
                revert QuestManager__QuestAlreadyCompleted();
            } else {
                revert QuestManager__QuestAlreadyRejected();
            }
        }

        // Get quest details
        Quest storage quest = s_quests[submission.questId];

        // Update submission
        submission.verifyTime = block.timestamp;
        submission.verifiedBy = msg.sender;

        if (approved) {
            // Check if pool has sufficient balance using low-level call
            (bool success, bytes memory data) = i_stakingPool.staticcall(
                abi.encodeWithSignature("getPoolBalance()")
            );
            require(success, "Failed to get pool balance");
            uint256 poolBalance = abi.decode(data, (uint256));
            if (poolBalance < quest.rewardAmount) {
                revert QuestManager__InsufficientPoolBalance();
            }

            // Mark as completed
            submission.status = QuestStatus.COMPLETED;
            s_playerCompletedQuest[submission.player][submission.questId] = true;
            quest.currentCompletions++;
            s_totalCompletedQuests++;

            // Distribute reward from staking pool using low-level call
            (bool rewardSuccess,) = i_stakingPool.call(
                abi.encodeWithSignature("distributeReward(address,uint256)", submission.player, quest.rewardAmount)
            );
            require(rewardSuccess, "Failed to distribute reward");

            // Mint NFT if minter is set using low-level call
            if (s_nftMinter != address(0)) {
                (bool nftSuccess, bytes memory nftData) = s_nftMinter.call(
                    abi.encodeWithSignature("mintQuestNFT(address,uint256,string)", submission.player, submission.questId, submission.tweetUrl)
                );
                if (nftSuccess && nftData.length > 0) {
                    submission.nftTokenId = abi.decode(nftData, (uint256));
                } else {
                    // NFT minting failed, but quest still completes successfully
                    submission.nftTokenId = 0;
                }
            }

            emit QuestVerified(
                submissionId,
                submission.questId,
                submission.player,
                QuestStatus.COMPLETED,
                msg.sender,
                submission.nftTokenId
            );

            emit RewardDistributed(submissionId, submission.questId, submission.player, quest.rewardAmount);
        } else {
            // Mark as rejected
            submission.status = QuestStatus.REJECTED;
            submission.rejectionReason = rejectionReason;

            emit QuestRejected(submissionId, submission.questId, submission.player, rejectionReason, msg.sender);
        }
    }

    /**
     * @notice Create a new quest
     * @param title Quest title
     * @param description Quest description
     * @param requirements What players need to do
     * @param rewardAmount Reward amount in USDC (6 decimals)
     * @param duration How long quest stays open (in seconds)
     * @param maxCompletions Maximum number of players who can complete
     * @dev Only admins can create quests
     */
    function createQuest(
        string calldata title,
        string calldata description,
        string calldata requirements,
        uint256 rewardAmount,
        uint256 duration,
        uint256 maxCompletions
    ) external onlyAdmin returns (uint256) {
        // Validate inputs
        if (bytes(title).length == 0 || bytes(requirements).length == 0) {
            revert QuestManager__EmptyTweetUrl();
        }
        if (rewardAmount == 0) {
            revert QuestManager__InvalidAmount();
        }
        if (duration == 0 || maxCompletions == 0) {
            revert QuestManager__InvalidAmount();
        }

        uint256 questId = s_nextQuestId++;
        Quest storage quest = s_quests[questId];

        quest.questId = questId;
        quest.title = title;
        quest.description = description;
        quest.requirements = requirements;
        quest.rewardAmount = rewardAmount;
        quest.isActive = true;
        quest.startTime = block.timestamp;
        quest.endTime = block.timestamp + duration;
        quest.maxCompletions = maxCompletions;
        quest.currentCompletions = 0;
        quest.creator = msg.sender;
        quest.createTime = block.timestamp;

        s_totalQuests++;

        emit QuestCreated(questId, title, rewardAmount, quest.startTime, quest.endTime, msg.sender);

        return questId;
    }

    // ============ Admin Functions ============
    /**
     * @notice Add a new admin
     * @param admin Address to grant admin privileges
     * @dev Only owner can add admins
     */
    function addAdmin(address admin) external onlyOwner validAddress(admin) {
        if (!s_admins[admin]) {
            s_admins[admin] = true;
            s_adminCount++;
            emit AdminAdded(admin, msg.sender);
        }
    }

    /**
     * @notice Remove an admin
     * @param admin Address to remove admin privileges from
     * @dev Only owner can remove admins, cannot remove owner
     */
    function removeAdmin(address admin) external onlyOwner validAddress(admin) {
        if (admin == owner()) {
            revert QuestManager__Unauthorized();
        }

        if (s_admins[admin]) {
            s_admins[admin] = false;
            s_adminCount--;
            emit AdminRemoved(admin, msg.sender);
        }
    }

    /**
     * @notice Set the NFT minter contract
     * @param nftMinter Address of the NFT minter contract
     * @dev Only owner can set NFT minter
     */
    function setNFTMinter(address nftMinter) external onlyOwner {
        address oldMinter = s_nftMinter;
        s_nftMinter = nftMinter;
        emit NFTMinterSet(oldMinter, nftMinter);
    }

    /**
     * @notice Toggle quest active status
     * @param questId ID of the quest to toggle
     * @dev Only admins can toggle quest status
     */
    function toggleQuestStatus(uint256 questId) external onlyAdmin questExists(questId) {
        Quest storage quest = s_quests[questId];
        quest.isActive = !quest.isActive;
        emit QuestStatusUpdated(questId, quest.isActive);
    }

    /**
     * @notice Pause the contract
     * @dev Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Admin Functions (continued) ============
    /**
     * @notice Create the default MVP quest (call after deployment)
     * @dev Only owner can create default quest
     */
    function createDefaultQuest() external onlyOwner {
        // Only create if no quests exist yet
        require(s_totalQuests == 0, "Default quest already exists");
        
        _createDefaultQuest();
    }

    // ============ Internal Functions ============
    /**
     * @notice Create the default MVP quest
     * @dev Called during contract initialization
     */
    function _createDefaultQuest() internal {
        uint256 questId = s_nextQuestId++;
        Quest storage quest = s_quests[questId];

        quest.questId = questId;
        quest.title = "Etherlink Quest - Tweet Challenge";
        quest.description = "Help spread the word about Quest on Etherlink!";
        quest.requirements = "Post a tweet with #EtherlinkQuest and tag our account";
        quest.rewardAmount = DEFAULT_REWARD_AMOUNT; // 1 USDC
        quest.isActive = true;
        quest.startTime = block.timestamp;
        quest.endTime = block.timestamp + (30 days); // 30 days for MVP
        quest.maxCompletions = 1000; // Allow 1000 completions
        quest.currentCompletions = 0;
        quest.creator = owner();
        quest.createTime = block.timestamp;

        s_totalQuests++;

        emit QuestCreated(questId, quest.title, quest.rewardAmount, quest.startTime, quest.endTime, owner());
    }

    // ============ View Functions ============
    /**
     * @notice Get quest details
     * @param questId ID of the quest
     * @return Quest struct with all details
     */
    function getQuest(uint256 questId) external view questExists(questId) returns (Quest memory) {
        return s_quests[questId];
    }

    /**
     * @notice Get submission details
     * @param submissionId ID of the submission
     * @return QuestSubmission struct with all details
     */
    function getSubmission(uint256 submissionId)
        external
        view
        submissionExists(submissionId)
        returns (QuestSubmission memory)
    {
        return s_submissions[submissionId];
    }

    /**
     * @notice Get all submissions for a quest
     * @param questId ID of the quest
     * @return Array of submission IDs
     */
    function getQuestSubmissions(uint256 questId) external view questExists(questId) returns (uint256[] memory) {
        return s_questSubmissions[questId];
    }

    /**
     * @notice Get all submissions by a player
     * @param player Address of the player
     * @return Array of submission IDs
     */
    function getPlayerSubmissions(address player) external view returns (uint256[] memory) {
        return s_playerSubmissions[player];
    }

    /**
     * @notice Check if player has completed a specific quest
     * @param player Address of the player
     * @param questId ID of the quest
     * @return Whether player has completed the quest
     */
    function hasPlayerCompletedQuest(address player, uint256 questId) external view returns (bool) {
        return s_playerCompletedQuest[player][questId];
    }

    /**
     * @notice Check if address is an admin
     * @param account Address to check
     * @return Whether address has admin privileges
     */
    function isAdmin(address account) external view returns (bool) {
        return s_admins[account] || account == owner();
    }

    /**
     * @notice Get contract statistics
     * @return totalQuests Total number of quests created
     * @return totalSubmissions Total number of submissions
     * @return totalCompletedQuests Total number of completed quest submissions
     * @return adminCount Number of admins
     */
    function getContractStats()
        external
        view
        returns (uint256 totalQuests, uint256 totalSubmissions, uint256 totalCompletedQuests, uint256 adminCount)
    {
        return (s_totalQuests, s_totalSubmissions, s_totalCompletedQuests, s_adminCount);
    }

    /**
     * @notice Get active quests
     * @return Array of quest IDs that are currently active
     */
    function getActiveQuests() external view returns (uint256[] memory) {
        // Count active quests first
        uint256 activeCount = 0;
        for (uint256 i = 1; i < s_nextQuestId; i++) {
            if (
                s_quests[i].isActive && block.timestamp >= s_quests[i].startTime
                    && block.timestamp <= s_quests[i].endTime && s_quests[i].currentCompletions < s_quests[i].maxCompletions
            ) {
                activeCount++;
            }
        }

        // Create array with active quest IDs
        uint256[] memory activeQuests = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < s_nextQuestId; i++) {
            if (
                s_quests[i].isActive && block.timestamp >= s_quests[i].startTime
                    && block.timestamp <= s_quests[i].endTime && s_quests[i].currentCompletions < s_quests[i].maxCompletions
            ) {
                activeQuests[index] = i;
                index++;
            }
        }

        return activeQuests;
    }

    /**
     * @notice Get pending submissions for admin review
     * @return Array of submission IDs with pending status
     */
    function getPendingSubmissions() external view returns (uint256[] memory) {
        // Count pending submissions first
        uint256 pendingCount = 0;
        for (uint256 i = 1; i < s_nextSubmissionId; i++) {
            if (s_submissions[i].status == QuestStatus.PENDING) {
                pendingCount++;
            }
        }

        // Create array with pending submission IDs
        uint256[] memory pendingSubmissions = new uint256[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 1; i < s_nextSubmissionId; i++) {
            if (s_submissions[i].status == QuestStatus.PENDING) {
                pendingSubmissions[index] = i;
                index++;
            }
        }

        return pendingSubmissions;
    }

    /**
     * @notice Get contract configuration
     * @return stakingPool Address of staking pool
     * @return nftMinter Address of NFT minter
     * @return totalQuests Number of quests created
     * @return nextQuestId Next quest ID to be assigned
     * @return nextSubmissionId Next submission ID to be assigned
     */
    function getConfig()
        external
        view
        returns (
            address stakingPool,
            address nftMinter,
            uint256 totalQuests,
            uint256 nextQuestId,
            uint256 nextSubmissionId
        )
    {
        return (i_stakingPool, s_nftMinter, s_totalQuests, s_nextQuestId, s_nextSubmissionId);
    }

    /**
     * @notice Get the default quest ID (for MVP)
     * @return Quest ID of the default quest
     */
    function getDefaultQuestId() external pure returns (uint256) {
        return 1; // First quest created is always the default quest
    }

}
