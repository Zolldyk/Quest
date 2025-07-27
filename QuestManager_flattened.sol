// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol

// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// lib/openzeppelin-contracts/contracts/utils/Pausable.sol

// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// Smart Contracts/src/QuestManager.sol

// ============ Imports ============

// ============ Interfaces ============
interface IStakingPool {
    function distributeReward(address recipient, uint256 amount) external;
    function getPoolBalance() external view returns (uint256);
}

interface INFTMinter {
    function mintQuestNFT(address recipient, uint256 questId, string memory tweetUrl) external returns (uint256);
}

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
contract QuestManager is Ownable, ReentrancyGuard, Pausable {
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
    IStakingPool private immutable i_stakingPool;
    INFTMinter private s_nftMinter;

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
     * @dev Sets the contract owner as the first admin
     */
    constructor(address stakingPool) Ownable(msg.sender) validAddress(stakingPool) {
        i_stakingPool = IStakingPool(stakingPool);

        // Set owner as first admin
        s_admins[msg.sender] = true;
        s_adminCount = 1;

        // Create the default quest for MVP
        _createDefaultQuest();
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
            // Check if pool has sufficient balance
            uint256 poolBalance = i_stakingPool.getPoolBalance();
            if (poolBalance < quest.rewardAmount) {
                revert QuestManager__InsufficientPoolBalance();
            }

            // Mark as completed
            submission.status = QuestStatus.COMPLETED;
            s_playerCompletedQuest[submission.player][submission.questId] = true;
            quest.currentCompletions++;
            s_totalCompletedQuests++;

            // Distribute reward from staking pool
            i_stakingPool.distributeReward(submission.player, quest.rewardAmount);

            // Mint NFT if minter is set
            if (address(s_nftMinter) != address(0)) {
                try s_nftMinter.mintQuestNFT(submission.player, submission.questId, submission.tweetUrl) returns (
                    uint256 tokenId
                ) {
                    submission.nftTokenId = tokenId;
                } catch {
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
        address oldMinter = address(s_nftMinter);
        s_nftMinter = INFTMinter(nftMinter);
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
        quest.creator = msg.sender;
        quest.createTime = block.timestamp;

        s_totalQuests++;

        emit QuestCreated(questId, quest.title, quest.rewardAmount, quest.startTime, quest.endTime, msg.sender);
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
        return (address(i_stakingPool), address(s_nftMinter), s_totalQuests, s_nextQuestId, s_nextSubmissionId);
    }

    /**
     * @notice Get the default quest ID (for MVP)
     * @return Quest ID of the default quest
     */
    function getDefaultQuestId() external pure returns (uint256) {
        return 1; // First quest created is always the default quest
    }

    // ============ Override Functions ============
    /**
     * @notice Override _msgSender to resolve multiple inheritance from Ownable and Pausable
     */
    function _msgSender() internal view override(Context) returns (address) {
        return super._msgSender();
    }

    /**
     * @notice Override _msgData to resolve multiple inheritance from Ownable and Pausable  
     */
    function _msgData() internal view override(Context) returns (bytes calldata) {
        return super._msgData();
    }

    /**
     * @notice Override _contextSuffixLength to resolve multiple inheritance from Ownable and Pausable
     */
    function _contextSuffixLength() internal view override(Context) returns (uint256) {
        return super._contextSuffixLength();
    }
}

