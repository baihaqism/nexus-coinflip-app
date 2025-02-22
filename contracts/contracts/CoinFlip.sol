// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CoinFlip {
    address public owner;
    event FlipResult(address player, bool win, uint256 betAmount, uint256 payout);
    event Withdrawn(address owner, uint256 amount);

    
    uint256[] public VALID_BETS = [1 ether, 5 ether, 10 ether, 25 ether, 50 ether, 100 ether];
    uint256 public constant FEE_PERCENT = 5;
    
    mapping(address => uint256) public playerNonces;
    
    constructor() payable {
        owner = msg.sender;  // Set the contract deployer as owner
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(amount);
        emit Withdrawn(owner, amount);
    }
    
    function withdrawAll() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Contract balance is empty");
        payable(owner).transfer(amount);
        emit Withdrawn(owner, amount);
    }
    
    function flip() external payable returns (bool) {
        // First check if it's a valid bet amount
        bool isValid = false;
        for (uint i = 0; i < VALID_BETS.length; i++) {
            if (msg.value == VALID_BETS[i]) {
                isValid = true;
                break;
            }
        }
        require(isValid, "Invalid bet amount - must be one of the valid bet amounts");
        
        // Calculate potential payout (1.95x the bet)
        uint256 potentialPayout = (msg.value * 195) / 100;
        
        // Check if contract has enough balance for THIS bet
        require(address(this).balance >= msg.value + potentialPayout, "Contract balance too low");
        
        // Get the player's current nonce and increment it
        uint256 currentNonce = playerNonces[msg.sender]++;
        
        // Use nonce in the randomness calculation
        bytes32 blockHash = blockhash(block.number - 1);
        uint256 random = uint256(keccak256(abi.encodePacked(
            blockHash,
            block.timestamp,
            msg.sender,
            block.prevrandao,
            currentNonce  // Add nonce to ensure uniqueness
        )));
        
        bool win = random % 2 == 0;
        uint256 payout = 0;
        
        if (win) {
            payout = potentialPayout;
            payable(msg.sender).transfer(payout);
        }
        
        emit FlipResult(msg.sender, win, msg.value, payout);
        return win;
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function isValidBet(uint256 amount) public view returns (bool) {
        for (uint i = 0; i < VALID_BETS.length; i++) {
            if (amount == VALID_BETS[i]) return true;
        }
        return false;
    }
    
    receive() external payable {}
}