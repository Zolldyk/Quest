// ============ Imports ============
import { BigInt, Address, Bytes, log } from "@graphprotocol/graph-ts";

// Import event types from generated contract bindings
import {
  QuestCreated as QuestCreatedEvent,
  QuestSubmitted as QuestSubmittedEvent,
  QuestVerified as QuestVerifiedEvent,
  QuestRejected as QuestRejectedEvent,
  RewardDistributed as RewardDistributedEvent,
  QuestStatusUpdated as QuestStatusUpdatedEvent,
} from "../generated/QuestManager/QuestManager";

import {
  QuestNFTMinted as QuestNFTMintedEvent,
  Transfer as NFTTransferEvent,
} from "../generated/NFTMinter/NFTMinter";

// Import entity types from generated schema
import {
  QuestTemplate,
  Player,
  QuestSubmission,
  QuestNFT,
  NFTTransfer,
  GlobalStats,
  DailyStats,
  EventLog,
} from "../generated/schema";

// ============ Constants ============
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const SECONDS_PER_DAY = BigInt.fromI32(86400);
const GLOBAL_STATS_ID = "global";

// ============ Helper Functions ============

/**
 * @notice Get or create a Player entity
 * @param address The player's wallet address
 * @returns Player entity
 */
function getOrCreatePlayer(address: Address): Player {
  let player = Player.load(address.toHexString());
  
  if (player == null) {
    player = new Player(address.toHexString());
    player.address = address;
    player.totalSubmissions = 0;
    player.questsCompleted = 0;
    player.questsRejected = 0;
    player.totalRewardsEarned = BigInt.fromI32(0);
    player.nftsMinted = 0;
    player.firstSubmissionTimestamp = BigInt.fromI32(0);
    player.lastActivityTimestamp = BigInt.fromI32(0);
    
    log.info("Created new Player entity for address: {}", [address.toHexString()]);
  }
  
  return player as Player;
}

/**
 * @notice Get or create a QuestTemplate entity
 * @param questId The quest ID from the contract
 * @returns QuestTemplate entity
 */
function getOrCreateQuestTemplate(questId: BigInt): QuestTemplate {
  let quest = QuestTemplate.load(questId.toString());
  
  if (quest == null) {
    quest = new QuestTemplate(questId.toString());
    quest.questId = questId;
    quest.questType = "";
    quest.rewardAmount = BigInt.fromI32(0);
    quest.submissionWindow = BigInt.fromI32(0);
    quest.endTime = BigInt.fromI32(0);
    quest.creator = Address.fromString(ZERO_ADDRESS);
    quest.isActive = true;
    quest.createdAt = BigInt.fromI32(0);
    quest.createdBlock = BigInt.fromI32(0);
    quest.completedCount = 0;
    quest.totalRewardsDistributed = BigInt.fromI32(0);
    
    log.info("Created new QuestTemplate entity for questId: {}", [questId.toString()]);
  }
  
  return quest as QuestTemplate;
}

/**
 * @notice Get or create the GlobalStats singleton entity
 * @returns GlobalStats entity
 */
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load(GLOBAL_STATS_ID);
  
  if (stats == null) {
    stats = new GlobalStats(GLOBAL_STATS_ID);
    stats.totalPlayers = 0;
    stats.totalQuests = 0;
    stats.totalSubmissions = 0;
    stats.totalQuestsCompleted = 0;
    stats.totalQuestsRejected = 0;
    stats.totalRewardsDistributed = BigInt.fromI32(0);
    stats.totalNFTsMinted = 0;
    stats.averageRewardPerQuest = BigInt.fromI32(0);
    stats.activePlayers = 0;
    stats.activeQuests = 0;
    stats.lastUpdated = BigInt.fromI32(0);
    stats.lastUpdatedBlock = BigInt.fromI32(0);
    
    log.info("Created new GlobalStats singleton entity", []);
  }
  
  return stats as GlobalStats;
}

/**
 * @notice Get or create daily stats for a given timestamp
 * @param timestamp Block timestamp
 * @returns DailyStats entity
 */
function getOrCreateDailyStats(timestamp: BigInt): DailyStats {
  // Calculate the start of the day (midnight UTC)
  let dayStart = timestamp.div(SECONDS_PER_DAY).times(SECONDS_PER_DAY);
  let dayId = dayStart.toString();
  
  let dailyStats = DailyStats.load(dayId);
  
  if (dailyStats == null) {
    dailyStats = new DailyStats(dayId);
    dailyStats.date = dayStart.toString();
    dailyStats.timestamp = dayStart;
    dailyStats.newPlayers = 0;
    dailyStats.submissions = 0;
    dailyStats.questsCompleted = 0;
    dailyStats.questsRejected = 0;
    dailyStats.rewardsDistributed = BigInt.fromI32(0);
    dailyStats.nftsMinted = 0;
    dailyStats.newQuests = 0;
    
    log.info("Created new DailyStats for date: {}", [dailyStats.date]);
  }
  
  return dailyStats as DailyStats;
}

/**
 * @notice Create an event log entry for debugging and audit purposes
 */
function createEventLog(
  eventName: string,
  contractAddress: Address,
  txHash: Bytes,
  blockNumber: BigInt,
  timestamp: BigInt,
  logIndex: BigInt,
  rawData: string
): void {
  let eventLogId = txHash.toHexString() + "-" + logIndex.toString();
  let eventLog = new EventLog(eventLogId);
  
  eventLog.eventName = eventName;
  eventLog.contractAddress = contractAddress;
  eventLog.transactionHash = txHash;
  eventLog.blockNumber = blockNumber;
  eventLog.timestamp = timestamp;
  eventLog.logIndex = logIndex;
  eventLog.rawData = rawData;
  
  eventLog.save();
}

/**
 * @notice Update global statistics
 */
function updateGlobalStats(timestamp: BigInt, blockNumber: BigInt): void {
  let stats = getOrCreateGlobalStats();
  
  // Calculate average reward per quest
  if (stats.totalQuestsCompleted > 0) {
    stats.averageRewardPerQuest = stats.totalRewardsDistributed.div(BigInt.fromI32(stats.totalQuestsCompleted));
  }
  
  stats.lastUpdated = timestamp;
  stats.lastUpdatedBlock = blockNumber;
  
  stats.save();
}

// ============ Quest Manager Event Handlers ============

/**
 * @notice Handle QuestCreated events from QuestManager contract
 */
export function handleQuestCreated(event: QuestCreatedEvent): void {
  log.info("Processing QuestCreated event for questId: {}", [
    event.params.questId.toString()
  ]);
  
  let quest = getOrCreateQuestTemplate(event.params.questId);
  quest.questType = event.params.title;
  quest.rewardAmount = event.params.rewardAmount;
  quest.submissionWindow = event.params.endTime.minus(event.params.startTime);
  quest.endTime = event.params.endTime;
  quest.creator = event.params.creator;
  quest.isActive = true;
  quest.createdAt = event.block.timestamp;
  quest.createdBlock = event.block.number;
  
  quest.save();
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalQuests = globalStats.totalQuests + 1;
  globalStats.activeQuests = globalStats.activeQuests + 1;
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.newQuests = dailyStats.newQuests + 1;
  dailyStats.save();
  
  // Create event log
  let rawData = `{"questId":"${event.params.questId.toString()}","title":"${event.params.title}","rewardAmount":"${event.params.rewardAmount.toString()}","startTime":"${event.params.startTime.toString()}","endTime":"${event.params.endTime.toString()}","creator":"${event.params.creator.toHexString()}"}`;
  createEventLog(
    "QuestCreated",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

/**
 * @notice Handle QuestSubmitted events from QuestManager contract
 */
export function handleQuestSubmitted(event: QuestSubmittedEvent): void {
  log.info("Processing QuestSubmitted event for submissionId: {} questId: {} player: {}", [
    event.params.submissionId.toString(),
    event.params.questId.toString(),
    event.params.player.toHexString()
  ]);
  
  // Get or create player
  let player = getOrCreatePlayer(event.params.player);
  let isFirstSubmission = player.totalSubmissions == 0;
  
  // Create quest submission
  let submission = new QuestSubmission(event.params.submissionId.toString());
  submission.submissionId = event.params.submissionId;
  submission.quest = event.params.questId.toString();
  submission.player = player.id;
  submission.tweetUrl = event.params.tweetUrl;
  submission.status = 0; // Pending
  submission.isVerified = false;
  submission.isApproved = false;
  submission.rewardAmount = BigInt.fromI32(0);
  submission.rewardDistributed = false;
  submission.submissionTimestamp = event.params.submitTime;
  submission.submissionTxHash = event.transaction.hash;
  submission.submissionBlock = event.block.number;
  
  submission.save();
  
  // Update player stats
  player.totalSubmissions = player.totalSubmissions + 1;
  player.lastActivityTimestamp = event.block.timestamp;
  
  if (isFirstSubmission) {
    player.firstSubmissionTimestamp = event.block.timestamp;
  }
  
  player.save();
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalSubmissions = globalStats.totalSubmissions + 1;
  
  if (isFirstSubmission) {
    globalStats.totalPlayers = globalStats.totalPlayers + 1;
    globalStats.activePlayers = globalStats.activePlayers + 1;
  }
  
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.submissions = dailyStats.submissions + 1;
  
  if (isFirstSubmission) {
    dailyStats.newPlayers = dailyStats.newPlayers + 1;
  }
  
  dailyStats.save();
  
  // Create event log
  let rawData = `{"submissionId":"${event.params.submissionId.toString()}","questId":"${event.params.questId.toString()}","player":"${event.params.player.toHexString()}","tweetUrl":"${event.params.tweetUrl}","submitTime":"${event.params.submitTime.toString()}"}`;
  createEventLog(
    "QuestSubmitted",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

/**
 * @notice Handle QuestVerified events from QuestManager contract
 */
export function handleQuestVerified(event: QuestVerifiedEvent): void {
  log.info("Processing QuestVerified event for submissionId: {} status: {}", [
    event.params.submissionId.toString(),
    event.params.status.toString()
  ]);
  
  let submission = QuestSubmission.load(event.params.submissionId.toString());
  
  if (submission == null) {
    log.error("QuestVerified event for unknown submission: {}", [event.params.submissionId.toString()]);
    return;
  }
  
  // Update submission
  submission.status = event.params.status;
  submission.isVerified = true;
  submission.isApproved = event.params.status == 1; // 1 = approved
  submission.verificationTimestamp = event.block.timestamp;
  submission.verificationTxHash = event.transaction.hash;
  submission.verificationBlock = event.block.number;
  submission.verifiedBy = event.params.verifiedBy;
  
  submission.save();
  
  // Update player stats
  let player = Player.load(submission.player);
  if (player != null) {
    if (submission.isApproved) {
      player.questsCompleted = player.questsCompleted + 1;
    } else {
      player.questsRejected = player.questsRejected + 1;
    }
    player.save();
  }
  
  // Update quest template stats
  let quest = QuestTemplate.load(submission.quest);
  if (quest != null && submission.isApproved) {
    quest.completedCount = quest.completedCount + 1;
    quest.save();
  }
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  if (submission.isApproved) {
    globalStats.totalQuestsCompleted = globalStats.totalQuestsCompleted + 1;
  } else {
    globalStats.totalQuestsRejected = globalStats.totalQuestsRejected + 1;
  }
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  if (submission.isApproved) {
    dailyStats.questsCompleted = dailyStats.questsCompleted + 1;
  } else {
    dailyStats.questsRejected = dailyStats.questsRejected + 1;
  }
  dailyStats.save();
  
  // Create event log
  let rawData = `{"submissionId":"${event.params.submissionId.toString()}","questId":"${event.params.questId.toString()}","player":"${event.params.player.toHexString()}","status":"${event.params.status.toString()}","verifiedBy":"${event.params.verifiedBy.toHexString()}","nftTokenId":"${event.params.nftTokenId.toString()}"}`;
  createEventLog(
    "QuestVerified",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

/**
 * @notice Handle QuestRejected events from QuestManager contract
 */
export function handleQuestRejected(event: QuestRejectedEvent): void {
  log.info("Processing QuestRejected event for submissionId: {}", [
    event.params.submissionId.toString()
  ]);
  
  let submission = QuestSubmission.load(event.params.submissionId.toString());
  
  if (submission == null) {
    log.error("QuestRejected event for unknown submission: {}", [event.params.submissionId.toString()]);
    return;
  }
  
  // Update submission
  submission.status = 2; // Rejected
  submission.isVerified = true;
  submission.isApproved = false;
  submission.rejectionReason = event.params.reason;
  submission.verificationTimestamp = event.block.timestamp;
  submission.verificationTxHash = event.transaction.hash;
  submission.verificationBlock = event.block.number;
  submission.verifiedBy = event.params.verifiedBy;
  
  submission.save();
  
  // Update player stats
  let player = Player.load(submission.player);
  if (player != null) {
    player.questsRejected = player.questsRejected + 1;
    player.save();
  }
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalQuestsRejected = globalStats.totalQuestsRejected + 1;
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.questsRejected = dailyStats.questsRejected + 1;
  dailyStats.save();
  
  // Create event log
  let rawData = `{"submissionId":"${event.params.submissionId.toString()}","questId":"${event.params.questId.toString()}","player":"${event.params.player.toHexString()}","reason":"${event.params.reason}","verifiedBy":"${event.params.verifiedBy.toHexString()}"}`;
  createEventLog(
    "QuestRejected",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

/**
 * @notice Handle RewardDistributed events from QuestManager contract
 */
export function handleRewardDistributed(event: RewardDistributedEvent): void {
  log.info("Processing RewardDistributed event for submissionId: {} amount: {}", [
    event.params.submissionId.toString(),
    event.params.amount.toString()
  ]);
  
  let submission = QuestSubmission.load(event.params.submissionId.toString());
  
  if (submission == null) {
    log.error("RewardDistributed event for unknown submission: {}", [event.params.submissionId.toString()]);
    return;
  }
  
  // Update submission
  submission.rewardAmount = event.params.amount;
  submission.rewardDistributed = true;
  submission.save();
  
  // Update player stats
  let player = Player.load(submission.player);
  if (player != null) {
    player.totalRewardsEarned = player.totalRewardsEarned.plus(event.params.amount);
    player.save();
  }
  
  // Update quest template stats
  let quest = QuestTemplate.load(submission.quest);
  if (quest != null) {
    quest.totalRewardsDistributed = quest.totalRewardsDistributed.plus(event.params.amount);
    quest.save();
  }
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalRewardsDistributed = globalStats.totalRewardsDistributed.plus(event.params.amount);
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.rewardsDistributed = dailyStats.rewardsDistributed.plus(event.params.amount);
  dailyStats.save();
  
  // Create event log
  let rawData = `{"submissionId":"${event.params.submissionId.toString()}","questId":"${event.params.questId.toString()}","player":"${event.params.player.toHexString()}","amount":"${event.params.amount.toString()}"}`;
  createEventLog(
    "RewardDistributed",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

/**
 * @notice Handle QuestStatusUpdated events from QuestManager contract
 */
export function handleQuestStatusUpdated(event: QuestStatusUpdatedEvent): void {
  log.info("Processing QuestStatusUpdated event for questId: {} isActive: {}", [
    event.params.questId.toString(),
    event.params.isActive.toString()
  ]);
  
  let quest = QuestTemplate.load(event.params.questId.toString());
  
  if (quest == null) {
    log.error("QuestStatusUpdated event for unknown quest: {}", [event.params.questId.toString()]);
    return;
  }
  
  // Update quest status
  let wasActive = quest.isActive;
  quest.isActive = event.params.isActive;
  quest.save();
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  if (wasActive && !event.params.isActive) {
    globalStats.activeQuests = globalStats.activeQuests - 1;
  } else if (!wasActive && event.params.isActive) {
    globalStats.activeQuests = globalStats.activeQuests + 1;
  }
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Create event log
  let rawData = `{"questId":"${event.params.questId.toString()}","isActive":"${event.params.isActive.toString()}"}`;
  createEventLog(
    "QuestStatusUpdated",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

// ============ NFT Minter Event Handlers ============

/**
 * @notice Handle QuestNFTMinted events from NFTMinter contract
 */
export function handleQuestNFTMinted(event: QuestNFTMintedEvent): void {
  log.info("Processing QuestNFTMinted event for tokenId: {} recipient: {} questId: {}", [
    event.params.tokenId.toString(),
    event.params.recipient.toHexString(),
    event.params.questId.toString()
  ]);
  
  // Create NFT entity
  let nft = new QuestNFT(event.params.tokenId.toString());
  nft.tokenId = event.params.tokenId;
  nft.contractAddress = event.address;
  nft.tweetUrl = event.params.tweetUrl;
  nft.mintTimestamp = event.params.mintTime;
  nft.mintTxHash = event.transaction.hash;
  nft.mintBlock = event.block.number;
  nft.isOriginalOwner = true;
  
  // Get or create player
  let player = getOrCreatePlayer(event.params.recipient);
  nft.owner = player.id;
  nft.originalRecipient = player.id;
  
  // Link to quest and submission
  nft.quest = event.params.questId.toString();
  
  // Find the submission for this quest and player
  // Note: In a real implementation, you might need a more sophisticated way to link submissions
  // For now, we'll leave submission as optional
  
  nft.save();
  
  // Update player NFT count
  player.nftsMinted = player.nftsMinted + 1;
  player.save();
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalNFTsMinted = globalStats.totalNFTsMinted + 1;
  updateGlobalStats(event.block.timestamp, event.block.number);
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.nftsMinted = dailyStats.nftsMinted + 1;
  dailyStats.save();
  
  // Create event log
  let rawData = `{"tokenId":"${event.params.tokenId.toString()}","recipient":"${event.params.recipient.toHexString()}","questId":"${event.params.questId.toString()}","tweetUrl":"${event.params.tweetUrl}","mintTime":"${event.params.mintTime.toString()}"}`;
  createEventLog(
    "QuestNFTMinted",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}

/**
 * @notice Handle Transfer events from NFTMinter contract (ERC721 transfers)
 */
export function handleNFTTransfer(event: NFTTransferEvent): void {
  // Skip minting events (from zero address) as they're handled by QuestNFTMinted
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    return;
  }
  
  log.info("Processing NFT Transfer event from: {} to: {} tokenId: {}", [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.tokenId.toString()
  ]);
  
  // Find the NFT entity
  let nft = QuestNFT.load(event.params.tokenId.toString());
  
  if (nft == null) {
    log.error("NFT Transfer event for unknown token: {}", [event.params.tokenId.toString()]);
    return;
  }
  
  // Create transfer record
  let transferId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let transfer = new NFTTransfer(transferId);
  transfer.nft = nft.id;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.transactionHash = event.transaction.hash;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  
  transfer.save();
  
  // Update NFT ownership
  let newOwner = getOrCreatePlayer(event.params.to);
  let oldOwner = Player.load(nft.owner);
  
  nft.owner = newOwner.id;
  nft.isOriginalOwner = false; // No longer owned by original recipient
  nft.save();
  
  // Update NFT counts
  newOwner.nftsMinted = newOwner.nftsMinted + 1;
  newOwner.save();
  
  if (oldOwner != null) {
    oldOwner.nftsMinted = oldOwner.nftsMinted - 1;
    oldOwner.save();
  }
  
  // Create event log
  let rawData = `{"from":"${event.params.from.toHexString()}","to":"${event.params.to.toHexString()}","tokenId":"${event.params.tokenId.toString()}"}`;
  createEventLog(
    "NFTTransfer",
    event.address,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    rawData
  );
}