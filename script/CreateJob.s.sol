// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CreateJob is Script {
    // Celo Mainnet addresses
    address constant CUSD         = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant ESCROW       = 0x6188A95d23792045dcBE06f705E018a9d9Ed54A7;
    address constant JUDGE        = 0xc16832565430dAd8d4F43Cf2c41af48590860620; // your deployer = judge agent

    uint256 constant TOTAL_AMOUNT = 500000000000000000;  // 0.50 cUSD (18 decimals)
    uint256 constant JUDGE_FEE    =  50000000000000000;  // 0.05 cUSD fee for judge
 

    
    string constant JOB_HASH =
        "Client requires a minimalist logo for a tech startup. "
        "Specifications: SVG format only, black and white color scheme, "
        "flat design with no gradients or 3D elements, must be scalable "
        "and work at both 32px and 512px. Freelancer submitted a brightly "
        "colored 3D cartoon mascot in PNG format. Deliverable does not meet "
        "the agreed specifications.";

   
    bytes4 constant APPROVE_SEL    = bytes4(keccak256("approve(address,uint256)"));
    bytes4 constant CREATE_JOB_SEL = bytes4(keccak256(
        "createJob(address,address,uint256,uint256,string)"
    ));

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        console.log("=== ChainVerdict: Create Job #5 ===");
        console.log("Deployer / Client:", deployer);
        console.log("Escrow contract  :", ESCROW);
        console.log("Judge address    :", JUDGE);
        console.log("Total amount     : 0.50 cUSD");
        console.log("Judge fee        : 0.05 cUSD");
        console.log("Net payout       : 0.45 cUSD");
        console.log("---");

        vm.startBroadcast(deployerKey);

        // Step 1: Approve escrow to pull cUSD from our wallet
        (bool approveOk,) = CUSD.call(
            abi.encodeWithSelector(APPROVE_SEL, ESCROW, TOTAL_AMOUNT)
        );
        require(approveOk, "cUSD approve failed");
        console.log("cUSD approved for escrow.");

        // Step 2: Create the job
        // createJob(freelancer, judge, totalAmount, judgeFee, jobHash)
        // Using deployer as freelancer too (same wallet = demo scenario)
        (bool createOk, bytes memory returnData) = ESCROW.call(
            abi.encodeWithSelector(
                CREATE_JOB_SEL,
                deployer,       // freelancer  (demo: same wallet)
                JUDGE,          // judge agent address
                TOTAL_AMOUNT,
                JUDGE_FEE,
                JOB_HASH
            )
        );
        require(createOk, "createJob failed");

        uint256 newJobId = abi.decode(returnData, (uint256));
        console.log("---");
        console.log("Job created successfully!");
        console.log("New Job ID:", newJobId);
        console.log("jobHash   :", JOB_HASH);
        console.log("---");
        console.log("Next steps:");
        console.log("  1. Update TEST_JOB_ID in frontend/src/App.js to:", newJobId);
        console.log("  2. Run the agent: python3 agent/judge_agent.py");
        console.log("  3. Raise dispute from the frontend");

        vm.stopBroadcast();
    }
}
