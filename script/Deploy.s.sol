// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentEscrow} from "../src/AgentEscrow.sol";
import {JudgeIdentity} from "../src/JudgeIdentity.sol";

contract Deploy is Script {
    // Official Celo Mainnet cUSD address
    address constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy JudgeIdentity first
        JudgeIdentity judgeIdentity = new JudgeIdentity(deployer);
        
        // Deploy AgentEscrow with cUSD
        AgentEscrow agentEscrow = new AgentEscrow(CUSD);

        vm.stopBroadcast();

        // Log addresses
        console.log("Deployer:", deployer);
        console.log("JudgeIdentity:", address(judgeIdentity));
        console.log("AgentEscrow:", address(agentEscrow));
    }
}