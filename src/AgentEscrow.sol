// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract AgentEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error Unauthorized();
    error InvalidStatus();
    error AlreadyResolved();
    error WaitPeriodNotMet();

    enum Status { OPEN, DISPUTED, RESOLVED, CANCELLED }
    
    IERC20 public immutable cUSD;
    uint256 public constant MIN_WAIT_PERIOD = 3 days; 

    struct Job {
        address client;
        address freelancer;
        address judgeAddress;
        uint256 amount;
        uint256 judgeFee; 
        uint256 createdAt;
        Status status;
        string jobHash; 
    }

    mapping(uint256 => Job) public jobs;
    uint256 public nextJobId;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount);
    event DisputeRaised(uint256 indexed jobId);
    event JobCancelled(uint256 indexed jobId);
    event VerdictRendered(uint256 indexed jobId, address winner, string reasoning);

    constructor(address _cUSD) {
        cUSD = IERC20(_cUSD);
    }

    function createJob(
        address _freelancer,
        address _judge,
        uint256 _totalAmount,
        uint256 _judgeFee,
        string calldata _jobHash
    ) external nonReentrant returns (uint256) {
        if (_totalAmount <= _judgeFee) revert InvalidStatus();
        
        uint256 jobId = nextJobId++;
        cUSD.safeTransferFrom(msg.sender, address(this), _totalAmount);

        jobs[jobId] = Job({
            client: msg.sender,
            freelancer: _freelancer,
            judgeAddress: _judge,
            amount: _totalAmount - _judgeFee,
            judgeFee: _judgeFee,
            createdAt: block.timestamp,
            status: Status.OPEN,
            jobHash: _jobHash
        });

        emit JobCreated(jobId, msg.sender, _freelancer, _totalAmount - _judgeFee);
        return jobId;
    }

    function raiseDispute(uint256 _jobId) external {
        Job storage j = jobs[_jobId];
        if (msg.sender != j.client && msg.sender != j.freelancer) revert Unauthorized();
        if (j.status != Status.OPEN) revert InvalidStatus();

        j.status = Status.DISPUTED;
        emit DisputeRaised(_jobId);
    }

    function cancelJob(uint256 _jobId) external nonReentrant {
        Job storage j = jobs[_jobId];
        if (msg.sender != j.client) revert Unauthorized();
        if (j.status != Status.OPEN) revert InvalidStatus();
        if (block.timestamp < j.createdAt + MIN_WAIT_PERIOD) revert WaitPeriodNotMet();

        j.status = Status.CANCELLED;
        cUSD.safeTransfer(j.client, j.amount + j.judgeFee);
        
        emit JobCancelled(_jobId);
    }

    function releaseToFreelancer(uint256 _jobId, string calldata _reasoning) external nonReentrant {
        Job storage j = jobs[_jobId];
        if (msg.sender != j.judgeAddress) revert Unauthorized();
        if (j.status != Status.DISPUTED) revert InvalidStatus();

        j.status = Status.RESOLVED;

        cUSD.safeTransfer(j.judgeAddress, j.judgeFee);
        cUSD.safeTransfer(j.freelancer, j.amount);

        emit VerdictRendered(_jobId, j.freelancer, _reasoning);
    }

    function refundToClient(uint256 _jobId, string calldata _reasoning) external nonReentrant {
        Job storage j = jobs[_jobId];
        if (msg.sender != j.judgeAddress) revert Unauthorized();
        if (j.status != Status.DISPUTED) revert InvalidStatus();

        j.status = Status.RESOLVED;

        cUSD.safeTransfer(j.judgeAddress, j.judgeFee);
        cUSD.safeTransfer(j.client, j.amount);

        emit VerdictRendered(_jobId, j.client, _reasoning);
    }
}