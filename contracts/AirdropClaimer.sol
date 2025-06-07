
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AirdropClaimer is Ownable, ReentrancyGuard {
    IERC20 public immutable bountyToken;
    uint256 public constant CLAIM_AMOUNT = 1000 * 10**18; // 1000 BTY tokens
    
    mapping(address => bool) public hasClaimed;
    
    event TokensClaimed(address indexed user, uint256 amount);
    
    constructor(address _bountyToken) Ownable(msg.sender) {
        bountyToken = IERC20(_bountyToken);
    }
    
    function claimTokens() external nonReentrant {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(bountyToken.balanceOf(address(this)) >= CLAIM_AMOUNT, "Insufficient tokens in contract");
        
        hasClaimed[msg.sender] = true;
        bountyToken.transfer(msg.sender, CLAIM_AMOUNT);
        
        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }
    
    function isEligible(address user) external view returns (bool) {
        return !hasClaimed[user];
    }
    
    function withdrawTokens(uint256 amount) external onlyOwner {
        bountyToken.transfer(owner(), amount);
    }
    
    function getContractBalance() external view returns (uint256) {
        return bountyToken.balanceOf(address(this));
    }
}
