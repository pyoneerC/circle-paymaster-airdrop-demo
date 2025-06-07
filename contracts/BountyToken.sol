
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BountyToken is ERC20, Ownable {
    constructor() ERC20("Test Bounty Token", "TEST") Ownable(msg.sender) {
        // Mint 10 million tokens to deployer
        _mint(msg.sender, 10_000_000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
