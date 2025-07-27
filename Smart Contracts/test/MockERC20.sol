// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============ Imports ============
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @author Quest Team
 * @notice Mock ERC20 token for testing purposes
 * @dev Simple ERC20 implementation with minting capability for tests
 */
contract MockERC20 is ERC20 {
    // ============ State variables ============
    uint8 private _decimals;

    // ============ Constructor ============
    /**
     * @notice Create a mock ERC20 token
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals_ Token decimals (default 18)
     */
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    // ============ Public Functions ============
    /**
     * @notice Mint tokens to an address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @dev Anyone can mint for testing purposes
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @dev Anyone can burn for testing purposes
     */
    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

    /**
     * @notice Override decimals function
     * @return Number of decimals
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Set decimals (for testing different decimal configurations)
     * @param decimals_ New decimal count
     */
    function setDecimals(uint8 decimals_) public {
        _decimals = decimals_;
    }

    /**
     * @notice Approve max amount for easy testing
     * @param spender Address to approve
     */
    function approveMax(address spender) public {
        _approve(_msgSender(), spender, type(uint256).max);
    }
}
