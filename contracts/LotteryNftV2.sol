//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LotteryNft.sol";

contract LotteryNftV2 is LotteryNft {
    bool isSurpriseWinnerPicked;

    function pickSurpriseWinner() public onlyOwner {
        require(!isSurpriseWinnerPicked, "Surprise winner is already picked!");
        require(!isEnded, "Lottery ended!");
        uint index = getRandomNumber() % players.length;
        players[index].transfer(address(this).balance / 2);
        isSurpriseWinnerPicked = true;
    }
}
