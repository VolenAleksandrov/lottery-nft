// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./Proxy.sol";

contract Factory {
    event Deployed(address addr, uint256 salt);

    function deploy(uint256 _salt) external {
        Proxy _proxyContract = new Proxy{salt: bytes32(_salt)}();

        emit Deployed(address(_proxyContract), _salt);
    }

    function getAddress(bytes memory bytecode, uint _salt)
        public
        view
        returns (address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(bytecode)
            )
        );
        return address(uint160(uint(hash)));
    }

    function getBytecode() public pure returns (bytes memory) {
      bytes memory bytecode = type(Proxy).creationCode;
      return abi.encodePacked(bytecode);
    }
}
