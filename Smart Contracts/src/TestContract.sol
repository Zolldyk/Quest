// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract TestContract is Ownable, Pausable, ReentrancyGuard {
    constructor(address initialOwner) Ownable(initialOwner) {
        // Test if this deploys successfully
    }
    
    function test() external view returns (address) {
        return owner();
    }
}