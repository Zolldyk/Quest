// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ============ Imports ============
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

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
 * @title StakingPool
 * @author Quest Team
 * @notice This contract manages staking pool for funding quest rewards using USDC
 * @dev Implements secure staking/unstaking with proper access controls and reentrancy protection
 */
contract StakingPool is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error StakingPool__InvalidAddress();
    error StakingPool__InvalidAmount();
    error StakingPool__InsufficientBalance(uint256 available, uint256 requested);
    error StakingPool__InsufficientPoolBalance(uint256 poolBalance, uint256 required);
    error StakingPool__TransferFailed();
    error StakingPool__Unauthorized();
    error StakingPool__ZeroAmount();

    // ============ Type declarations ============
    struct StakerInfo {
        uint256 stakedAmount; // Total amount staked by user
        uint256 stakeTimestamp; // When the user first staked
        uint256 lastUpdateTime; // Last time stake was updated
        bool isActive; // Whether the staker is currently active
    }

    // ============ State variables ============
    // Staking token (USDC)
    IERC20 private immutable i_stakingToken;

    // Quest manager contract that can withdraw rewards
    address private s_questManager;

    // Pool tracking
    uint256 private s_totalPoolBalance; // Total tokens in the pool
    uint256 private s_totalStakers; // Number of active stakers
    uint256 private s_totalRewardsDistributed; // Total rewards distributed from pool

    // Staker mappings
    mapping(address => StakerInfo) private s_stakers;
    mapping(uint256 => address) private s_stakerAddresses; // For enumeration

    // Configuration
    uint256 private s_minimumStakeAmount = 1e6; // 1 USDC minimum stake (6 decimals)
    uint256 private s_emergencyWithdrawDelay = 7 days; // Emergency withdrawal delay
    uint256 private s_emergencyWithdrawTimestamp = 0;

    // ============ Events ============
    event Staked(address indexed staker, uint256 amount, uint256 newStakeAmount, uint256 newPoolBalance);
    event Unstaked(address indexed staker, uint256 amount, uint256 remainingStakeAmount, uint256 newPoolBalance);
    event RewardDistributed(address indexed recipient, uint256 amount, uint256 newPoolBalance);
    event QuestManagerSet(address indexed oldManager, address indexed newManager);
    event MinimumStakeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event EmergencyWithdrawInitiated(uint256 timestamp, uint256 delay);
    event EmergencyWithdraw(address indexed recipient, uint256 amount);
    event PoolReplenished(address indexed contributor, uint256 amount, uint256 newPoolBalance);

    // ============ Modifiers ============
    /**
     * @notice Modifier to restrict access to quest manager only
     */
    modifier onlyQuestManager() {
        if (msg.sender != s_questManager) {
            revert StakingPool__Unauthorized();
        }
        _;
    }

    /**
     * @notice Modifier to check for valid addresses
     */
    modifier validAddress(address _address) {
        if (_address == address(0)) {
            revert StakingPool__InvalidAddress();
        }
        _;
    }

    /**
     * @notice Modifier to check for non-zero amounts
     */
    modifier nonZeroAmount(uint256 _amount) {
        if (_amount == 0) {
            revert StakingPool__ZeroAmount();
        }
        _;
    }

    // ============ Constructor ============
    /**
     * @notice Initialize the staking pool with USDC token
     * @param stakingToken Address of the USDC token contract on Etherlink
     * @dev Sets the contract owner and initializes with paused state for safety
     */
    constructor(address stakingToken) Ownable(msg.sender) validAddress(stakingToken) {
        i_stakingToken = IERC20(stakingToken);

        // Start in paused state for initial setup
        _pause();
    }

    // ============ External Functions ============
    /**
     * @notice Stake USDC tokens into the pool to fund quest rewards
     * @param amount Amount of USDC to stake (in 6 decimal format)
     * @dev Users must approve this contract to spend their USDC before calling
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused nonZeroAmount(amount) {
        // Validate minimum stake amount
        if (amount < s_minimumStakeAmount) {
            revert StakingPool__InvalidAmount();
        }

        // Check user's balance
        uint256 userBalance = i_stakingToken.balanceOf(msg.sender);
        if (userBalance < amount) {
            revert StakingPool__InsufficientBalance(userBalance, amount);
        }

        // Check allowance
        uint256 allowance = i_stakingToken.allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert StakingPool__InsufficientBalance(allowance, amount);
        }

        // Get current staker info
        StakerInfo storage staker = s_stakers[msg.sender];

        // If new staker, initialize
        if (!staker.isActive) {
            staker.isActive = true;
            staker.stakeTimestamp = block.timestamp;
            s_stakerAddresses[s_totalStakers] = msg.sender;
            s_totalStakers++;
        }

        // Update staker info
        staker.stakedAmount += amount;
        staker.lastUpdateTime = block.timestamp;

        // Update pool balance
        s_totalPoolBalance += amount;

        // Transfer tokens to this contract
        i_stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, staker.stakedAmount, s_totalPoolBalance);
    }

    /**
     * @notice Unstake USDC tokens from the pool
     * @param amount Amount of USDC to unstake (in 6 decimal format)
     * @dev Users can unstake at any time without penalties in MVP
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused nonZeroAmount(amount) {
        StakerInfo storage staker = s_stakers[msg.sender];

        // Check if user has sufficient staked amount
        if (!staker.isActive || staker.stakedAmount < amount) {
            revert StakingPool__InsufficientBalance(staker.stakedAmount, amount);
        }

        // Check if pool has sufficient balance for withdrawal
        if (s_totalPoolBalance < amount) {
            revert StakingPool__InsufficientPoolBalance(s_totalPoolBalance, amount);
        }

        // Update staker info
        staker.stakedAmount -= amount;
        staker.lastUpdateTime = block.timestamp;

        // If staker has no remaining stake, deactivate
        if (staker.stakedAmount == 0) {
            staker.isActive = false;
            // Note: We don't remove from s_stakerAddresses to maintain indices
        }

        // Update pool balance
        s_totalPoolBalance -= amount;

        // Transfer tokens back to user
        i_stakingToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, staker.stakedAmount, s_totalPoolBalance);
    }

    /**
     * @notice Distribute reward from pool to quest completer
     * @param recipient Address to receive the reward
     * @param amount Amount of USDC to distribute as reward
     * @dev Only callable by quest manager contract
     */
    function distributeReward(address recipient, uint256 amount)
        external
        onlyQuestManager
        nonReentrant
        validAddress(recipient)
        nonZeroAmount(amount)
    {
        // Check if pool has sufficient balance
        if (s_totalPoolBalance < amount) {
            revert StakingPool__InsufficientPoolBalance(s_totalPoolBalance, amount);
        }

        // Update pool balance and tracking
        s_totalPoolBalance -= amount;
        s_totalRewardsDistributed += amount;

        // Transfer reward to recipient
        i_stakingToken.safeTransfer(recipient, amount);

        emit RewardDistributed(recipient, amount, s_totalPoolBalance);
    }

    /**
     * @notice Replenish pool with additional tokens (for emergency or community contributions)
     * @param amount Amount of USDC to add to the pool
     * @dev Anyone can contribute to replenish the pool
     */
    function replenishPool(uint256 amount) external nonReentrant whenNotPaused nonZeroAmount(amount) {
        // Check user's balance and allowance
        uint256 userBalance = i_stakingToken.balanceOf(msg.sender);
        if (userBalance < amount) {
            revert StakingPool__InsufficientBalance(userBalance, amount);
        }

        uint256 allowance = i_stakingToken.allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert StakingPool__InsufficientBalance(allowance, amount);
        }

        // Update pool balance
        s_totalPoolBalance += amount;

        // Transfer tokens to pool
        i_stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit PoolReplenished(msg.sender, amount, s_totalPoolBalance);
    }

    // ============ Admin Functions ============
    /**
     * @notice Set the quest manager contract address
     * @param questManager Address of the quest manager contract
     * @dev Only callable by owner
     */
    function setQuestManager(address questManager) external onlyOwner validAddress(questManager) {
        address oldManager = s_questManager;
        s_questManager = questManager;
        emit QuestManagerSet(oldManager, questManager);
    }

    /**
     * @notice Update minimum stake amount
     * @param newMinimumAmount New minimum stake amount in USDC (6 decimals)
     * @dev Only callable by owner
     */
    function setMinimumStakeAmount(uint256 newMinimumAmount) external onlyOwner nonZeroAmount(newMinimumAmount) {
        uint256 oldAmount = s_minimumStakeAmount;
        s_minimumStakeAmount = newMinimumAmount;
        emit MinimumStakeAmountUpdated(oldAmount, newMinimumAmount);
    }

    /**
     * @notice Pause the contract (stops staking/unstaking)
     * @dev Only callable by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (resumes staking/unstaking)
     * @dev Only callable by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Initiate emergency withdrawal (with time delay for security)
     * @dev Only callable by owner in extreme circumstances
     */
    function initiateEmergencyWithdraw() external onlyOwner {
        s_emergencyWithdrawTimestamp = block.timestamp;
        emit EmergencyWithdrawInitiated(block.timestamp, s_emergencyWithdrawDelay);
    }

    /**
     * @notice Execute emergency withdrawal after delay period
     * @dev Only callable by owner after emergency withdrawal has been initiated and delay passed
     */
    function executeEmergencyWithdraw() external onlyOwner {
        // Check if emergency withdrawal was initiated
        if (s_emergencyWithdrawTimestamp == 0) {
            revert StakingPool__Unauthorized();
        }

        // Check if delay period has passed
        if (block.timestamp < s_emergencyWithdrawTimestamp + s_emergencyWithdrawDelay) {
            revert StakingPool__Unauthorized();
        }

        // Get contract balance
        uint256 contractBalance = i_stakingToken.balanceOf(address(this));

        if (contractBalance > 0) {
            // Transfer all tokens to owner
            i_stakingToken.safeTransfer(owner(), contractBalance);

            // Reset pool balance
            s_totalPoolBalance = 0;

            emit EmergencyWithdraw(owner(), contractBalance);
        }

        // Reset emergency withdraw timestamp
        s_emergencyWithdrawTimestamp = 0;
    }

    // ============ View Functions ============
    /**
     * @notice Get the total pool balance
     * @return Total USDC in the pool available for rewards
     */
    function getPoolBalance() external view returns (uint256) {
        return s_totalPoolBalance;
    }

    /**
     * @notice Get staker information
     * @param staker Address of the staker
     * @return stakedAmount Amount staked by user
     * @return stakeTimestamp When user first staked
     * @return lastUpdateTime Last time stake was updated
     * @return isActive Whether staker is currently active
     */
    function getStakerInfo(address staker)
        external
        view
        returns (uint256 stakedAmount, uint256 stakeTimestamp, uint256 lastUpdateTime, bool isActive)
    {
        StakerInfo memory info = s_stakers[staker];
        return (info.stakedAmount, info.stakeTimestamp, info.lastUpdateTime, info.isActive);
    }

    /**
     * @notice Get pool statistics
     * @return totalPoolBalance Total USDC in pool
     * @return totalStakers Number of active stakers
     * @return totalRewardsDistributed Total rewards distributed
     * @return minimumStakeAmount Minimum amount required to stake
     */
    function getPoolStats()
        external
        view
        returns (
            uint256 totalPoolBalance,
            uint256 totalStakers,
            uint256 totalRewardsDistributed,
            uint256 minimumStakeAmount
        )
    {
        return (s_totalPoolBalance, s_totalStakers, s_totalRewardsDistributed, s_minimumStakeAmount);
    }

    /**
     * @notice Get staking token address
     * @return Address of the USDC token contract
     */
    function getStakingToken() external view returns (address) {
        return address(i_stakingToken);
    }

    /**
     * @notice Get quest manager address
     * @return Address of the quest manager contract
     */
    function getQuestManager() external view returns (address) {
        return s_questManager;
    }

    /**
     * @notice Get contract configuration
     * @return stakingToken Address of USDC token
     * @return questManager Address of quest manager
     * @return minimumStakeAmount Minimum stake amount
     * @return emergencyWithdrawDelay Emergency withdrawal delay
     * @return isPaused Whether contract is paused
     */
    function getConfig()
        external
        view
        returns (
            address stakingToken,
            address questManager,
            uint256 minimumStakeAmount,
            uint256 emergencyWithdrawDelay,
            bool isPaused
        )
    {
        return (address(i_stakingToken), s_questManager, s_minimumStakeAmount, s_emergencyWithdrawDelay, paused());
    }

    /**
     * @notice Check if emergency withdrawal is ready to execute
     * @return isInitiated Whether emergency withdrawal has been initiated
     * @return canExecute Whether emergency withdrawal can be executed now
     * @return timeRemaining Time remaining until execution is allowed
     */
    function getEmergencyWithdrawStatus()
        external
        view
        returns (bool isInitiated, bool canExecute, uint256 timeRemaining)
    {
        isInitiated = s_emergencyWithdrawTimestamp != 0;

        if (isInitiated) {
            uint256 executionTime = s_emergencyWithdrawTimestamp + s_emergencyWithdrawDelay;
            canExecute = block.timestamp >= executionTime;
            timeRemaining = canExecute ? 0 : executionTime - block.timestamp;
        } else {
            canExecute = false;
            timeRemaining = 0;
        }
    }
}
