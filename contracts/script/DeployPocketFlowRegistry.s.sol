// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PocketFlowRegistry.sol";

contract DeployPocketFlowRegistry is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(privateKey);

        PocketFlowRegistry registry = new PocketFlowRegistry();

        vm.stopBroadcast();

        console2.log("PocketFlowRegistry deployed at:", address(registry));
    }
}