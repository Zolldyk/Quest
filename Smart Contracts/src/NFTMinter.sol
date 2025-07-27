// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============ Imports ============
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

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
 * @title NFTMinter
 * @author Quest Team
 * @notice This contract mints NFT badges for quest completions using Sequence-compatible standards
 * @dev ERC721 NFTs with dynamic metadata based on quest completion details
 */
contract NFTMinter is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;

    // ============ Errors ============
    error NFTMinter__InvalidAddress();
    error NFTMinter__Unauthorized();
    error NFTMinter__InvalidQuestId();
    error NFTMinter__EmptyTweetUrl();
    error NFTMinter__TokenDoesNotExist();
    error NFTMinter__BaseURINotSet();
    error NFTMinter__InvalidTokenId();

    // ============ Type declarations ============
    struct QuestBadge {
        uint256 questId; // Which quest was completed
        address recipient; // Who completed the quest
        string tweetUrl; // Proof of completion
        uint256 mintTime; // When NFT was minted
        uint256 questReward; // Reward amount received
        string questTitle; // Title of completed quest
        bool isValid; // Whether this badge is valid
    }

    // ============ State variables ============
    // Quest manager contract (only it can mint)
    address private s_questManager;

    // NFT tracking
    uint256 private s_nextTokenId = 1;
    uint256 private s_totalMinted = 0;

    // Badge information
    mapping(uint256 => QuestBadge) private s_badges;
    mapping(address => uint256[]) private s_userBadges; // user => token IDs
    mapping(uint256 => uint256[]) private s_questBadges; // questId => token IDs

    // Metadata configuration
    string private s_baseTokenURI;
    string private s_contractURI;

    // Collection info
    string private constant COLLECTION_NAME = "Quest Badges";
    string private constant COLLECTION_SYMBOL = "QBADGE";
    string private constant COLLECTION_DESCRIPTION = "NFT badges earned by completing quests on Etherlink";

    // Default badge image (base64 encoded SVG)
    string private s_defaultBadgeImage;

    // ============ Events ============
    event QuestNFTMinted(
        uint256 indexed tokenId, address indexed recipient, uint256 indexed questId, string tweetUrl, uint256 mintTime
    );
    event QuestManagerSet(address indexed oldManager, address indexed newManager);
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);
    event ContractURIUpdated(string oldContractURI, string newContractURI);
    event DefaultImageUpdated(string newImageData);
    event BadgeInvalidated(uint256 indexed tokenId, address indexed invalidatedBy);

    // ============ Modifiers ============
    /**
     * @notice Modifier to restrict access to quest manager only
     */
    modifier onlyQuestManager() {
        if (msg.sender != s_questManager) {
            revert NFTMinter__Unauthorized();
        }
        _;
    }

    /**
     * @notice Modifier to check for valid addresses
     */
    modifier validAddress(address _address) {
        if (_address == address(0)) {
            revert NFTMinter__InvalidAddress();
        }
        _;
    }

    /**
     * @notice Modifier to check token exists
     */
    modifier tokenExists(uint256 tokenId) {
        if (!_exists(tokenId)) {
            revert NFTMinter__TokenDoesNotExist();
        }
        _;
    }

    // ============ Constructor ============
    /**
     * @notice Initialize the NFT contract
     * @dev Sets up ERC721 with collection name and symbol, owner as deployer
     */
    constructor() ERC721(COLLECTION_NAME, COLLECTION_SYMBOL) Ownable(msg.sender) {
        // Set default SVG image for badges
        _setDefaultBadgeImage();

        // Set default contract URI for marketplace compatibility
        s_contractURI = _generateContractURI();
    }

    // ============ External Functions ============
    /**
     * @notice Mint a quest completion NFT badge
     * @param recipient Address to receive the NFT
     * @param questId ID of the completed quest
     * @param tweetUrl URL of the tweet proof
     * @return tokenId The minted token ID
     * @dev Only quest manager can mint NFTs
     */
    function mintQuestNFT(address recipient, uint256 questId, string calldata tweetUrl)
        external
        onlyQuestManager
        nonReentrant
        whenNotPaused
        validAddress(recipient)
        returns (uint256)
    {
        // Validate inputs
        if (questId == 0) {
            revert NFTMinter__InvalidQuestId();
        }
        if (bytes(tweetUrl).length == 0) {
            revert NFTMinter__EmptyTweetUrl();
        }

        // Get next token ID
        uint256 tokenId = s_nextTokenId++;

        // Create badge information
        QuestBadge storage badge = s_badges[tokenId];
        badge.questId = questId;
        badge.recipient = recipient;
        badge.tweetUrl = tweetUrl;
        badge.mintTime = block.timestamp;
        badge.questReward = 1e6; // 1 USDC default for MVP
        badge.questTitle = _getQuestTitle(questId);
        badge.isValid = true;

        // Update tracking mappings
        s_userBadges[recipient].push(tokenId);
        s_questBadges[questId].push(tokenId);
        s_totalMinted++;

        // Mint the NFT
        _safeMint(recipient, tokenId);

        // Set token URI with dynamic metadata
        string memory generatedTokenURI = _generateTokenURI(tokenId);
        _setTokenURI(tokenId, generatedTokenURI);

        emit QuestNFTMinted(tokenId, recipient, questId, tweetUrl, block.timestamp);

        return tokenId;
    }

    // ============ Admin Functions ============
    /**
     * @notice Set the quest manager contract address
     * @param questManager Address of the quest manager contract
     * @dev Only owner can set quest manager
     */
    function setQuestManager(address questManager) external onlyOwner validAddress(questManager) {
        address oldManager = s_questManager;
        s_questManager = questManager;
        emit QuestManagerSet(oldManager, questManager);
    }

    /**
     * @notice Set base URI for token metadata
     * @param baseURI New base URI for metadata
     * @dev Only owner can update base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        string memory oldBaseURI = s_baseTokenURI;
        s_baseTokenURI = baseURI;
        emit BaseURIUpdated(oldBaseURI, baseURI);
    }

    /**
     * @notice Set contract URI for marketplace metadata
     * @param contractURI_ New contract URI
     * @dev Only owner can update contract URI
     */
    function setContractURI(string calldata contractURI_) external onlyOwner {
        string memory oldContractURI = s_contractURI;
        s_contractURI = contractURI_;
        emit ContractURIUpdated(oldContractURI, contractURI_);
    }

    /**
     * @notice Update default badge image
     * @param imageData Base64 encoded image data
     * @dev Only owner can update default image
     */
    function setDefaultBadgeImage(string calldata imageData) external onlyOwner {
        s_defaultBadgeImage = imageData;
        emit DefaultImageUpdated(imageData);
    }

    /**
     * @notice Invalidate a badge (in case of fraud or error)
     * @param tokenId Token ID to invalidate
     * @dev Only owner can invalidate badges
     */
    function invalidateBadge(uint256 tokenId) external onlyOwner tokenExists(tokenId) {
        s_badges[tokenId].isValid = false;
        emit BadgeInvalidated(tokenId, msg.sender);
    }

    /**
     * @notice Pause minting
     * @dev Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause minting
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============
    /**
     * @notice Generate dynamic token URI with metadata
     * @param tokenId Token ID to generate URI for
     * @return JSON metadata URI
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        QuestBadge memory badge = s_badges[tokenId];

        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Quest Badge #',
                        tokenId.toString(),
                        '",',
                        '"description": "Badge earned for completing: ',
                        badge.questTitle,
                        '",',
                        '"image": "',
                        s_defaultBadgeImage,
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Quest ID", "value": "',
                        badge.questId.toString(),
                        '"},',
                        '{"trait_type": "Quest Title", "value": "',
                        badge.questTitle,
                        '"},',
                        '{"trait_type": "Completion Date", "value": "',
                        badge.mintTime.toString(),
                        '"},',
                        '{"trait_type": "Reward Amount", "value": "',
                        (badge.questReward / 1e6).toString(),
                        ' USDC"},',
                        '{"trait_type": "Valid", "value": "',
                        badge.isValid ? "true" : "false",
                        '"},',
                        '{"trait_type": "Network", "value": "Etherlink"}',
                        "]}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @notice Generate contract-level metadata URI
     * @return JSON metadata for contract
     */
    function _generateContractURI() internal pure returns (string memory) {
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        COLLECTION_NAME,
                        '",',
                        '"description": "',
                        COLLECTION_DESCRIPTION,
                        '",',
                        '"image": "https://quest-app.etherlink.com/images/collection-banner.png",',
                        '"external_link": "https://quest-app.etherlink.com",',
                        '"seller_fee_basis_points": 0,',
                        '"fee_recipient": "0x0000000000000000000000000000000000000000"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @notice Set default SVG badge image
     * @dev Creates a simple SVG badge design
     */
    function _setDefaultBadgeImage() internal {
        string memory svg = string(
            abi.encodePacked(
                '<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">',
                "<defs>",
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />',
                "</linearGradient>",
                '<filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter>',
                "</defs>",
                '<rect width="400" height="400" fill="url(#bg)" rx="20"/>',
                '<circle cx="200" cy="150" r="60" fill="#FFD700" stroke="#FFA500" stroke-width="4" filter="url(#shadow)"/>',
                string(
                    abi.encodePacked(
                        '<text x="200" y="160" text-anchor="middle" fill="#333" font-family="Arial, sans-serif" font-size="32" font-weight="bold">',
                        unicode"✓",
                        "</text>"
                    )
                ),
                '<text x="200" y="250" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">QUEST</text>',
                '<text x="200" y="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">COMPLETED</text>',
                '<text x="200" y="320" text-anchor="middle" fill="#E0E0E0" font-family="Arial, sans-serif" font-size="14">Powered by Etherlink</text>',
                "</svg>"
            )
        );

        s_defaultBadgeImage = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg))));
    }

    /**
     * @notice Get quest title (simplified for MVP)
     * @param questId Quest ID
     * @return Quest title string
     */
    function _getQuestTitle(uint256 questId) internal pure returns (string memory) {
        if (questId == 1) {
            return "Etherlink Quest - Tweet Challenge";
        }
        return string(abi.encodePacked("Quest #", questId.toString()));
    }

    /**
     * @notice Override for ERC721URIStorage
     */
    function _baseURI() internal view override returns (string memory) {
        return s_baseTokenURI;
    }

    /**
     * @notice Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < s_nextTokenId;
    }

    // ============ Public Functions ============
    /**
     * @notice Override tokenURI to support both base URI and individual URIs
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        tokenExists(tokenId)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Get contract-level metadata URI for marketplaces
     */
    function contractURI() public view returns (string memory) {
        return s_contractURI;
    }

    /**
     * @notice Check if contract supports interface
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Override _update to handle multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }

    // ============ View Functions ============
    /**
     * @notice Get badge information for a token
     * @param tokenId Token ID to query
     * @return QuestBadge struct with all badge details
     */
    function getBadge(uint256 tokenId) external view tokenExists(tokenId) returns (QuestBadge memory) {
        return s_badges[tokenId];
    }

    /**
     * @notice Get all badges owned by a user
     * @param user Address to query badges for
     * @return Array of token IDs owned by user
     */
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return s_userBadges[user];
    }

    /**
     * @notice Get all badges for a specific quest
     * @param questId Quest ID to query badges for
     * @return Array of token IDs for the quest
     */
    function getQuestBadges(uint256 questId) external view returns (uint256[] memory) {
        return s_questBadges[questId];
    }

    /**
     * @notice Get user's badge count
     * @param user Address to query
     * @return Number of badges owned by user
     */
    function getUserBadgeCount(address user) external view returns (uint256) {
        return s_userBadges[user].length;
    }

    /**
     * @notice Get quest badge count
     * @param questId Quest ID to query
     * @return Number of badges minted for the quest
     */
    function getQuestBadgeCount(uint256 questId) external view returns (uint256) {
        return s_questBadges[questId].length;
    }

    /**
     * @notice Get collection statistics
     * @return totalMinted Total number of badges minted
     * @return nextTokenId Next token ID to be minted
     * @return questManager Address of quest manager
     */
    function getCollectionStats()
        external
        view
        returns (uint256 totalMinted, uint256 nextTokenId, address questManager)
    {
        return (s_totalMinted, s_nextTokenId, s_questManager);
    }

    /**
     * @notice Get configuration details
     * @return baseTokenURI Base URI for metadata
     * @return contractURI_ Contract-level metadata URI
     * @return defaultBadgeImage Default badge image data
     * @return collectionName Name of the collection
     * @return collectionSymbol Symbol of the collection
     */
    function getConfig()
        external
        view
        returns (
            string memory baseTokenURI,
            string memory contractURI_,
            string memory defaultBadgeImage,
            string memory collectionName,
            string memory collectionSymbol
        )
    {
        return (s_baseTokenURI, s_contractURI, s_defaultBadgeImage, COLLECTION_NAME, COLLECTION_SYMBOL);
    }

    /**
     * @notice Check if a badge is valid
     * @param tokenId Token ID to check
     * @return Whether the badge is valid
     */
    function isBadgeValid(uint256 tokenId) external view tokenExists(tokenId) returns (bool) {
        return s_badges[tokenId].isValid;
    }

    /**
     * @notice Get total supply of badges
     * @return Total number of badges minted
     */
    function totalSupply() external view returns (uint256) {
        return s_totalMinted;
    }
}
