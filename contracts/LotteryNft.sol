//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LotteryNft is Initializable, ERC721URIStorageUpgradeable, OwnableUpgradeable {

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    address payable[] public players;
    uint startingBlockNumber;
    uint endingBlockNumber;
    bool isEnded;

    function initialize(uint startingBlock, uint endingBlock) public initializer {
        __ERC721_init("Lottery", "LOTTERY");
        __Ownable_init();
        startingBlockNumber = startingBlock;
        endingBlockNumber = endingBlock;
    }

    function buyTicket(string memory tokenURI) public payable returns(uint256) {
        require(startingBlockNumber <= block.number, "Lottery is not started yet!");
        require(!isEnded, "Lottery ended!");
        require(endingBlockNumber >= block.number, "Lottery is closed for new bets!");
        require(msg.value == 1 ether, "Required ticket price is 1 ETH!");

        // address of player entering lottery
        players.push(payable(msg.sender));
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _safeMint(msg.sender, newItemId); //mint the token
        _setTokenURI(newItemId, tokenURI); //generate the URI
        //approve(contractAddress, newItemId); //grant transaction permission to marketplace
        
        return newItemId;
    }

    function getTokensCounter() public view returns(uint256) {
        return _tokenIds.current();
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function getRandomNumber() public view returns (uint) {
        return uint(keccak256(abi.encodePacked(owner(), block.timestamp)));
    }

    function pickWinner() public onlyOwner {
        require(endingBlockNumber < block.number, "Lottery is still open for new players!");
        require(!isEnded, "Lottery ended!");
        uint index = getRandomNumber() % players.length;
        players[index].transfer(address(this).balance);
        isEnded = true;
    }
}
