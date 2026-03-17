// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract JudgeIdentity is Ownable {
    
   
    error InvalidAddress();

   
    struct AgentProfile {
        address judgeAddress; 
        string name;         
        string metadataURI; 
        uint256 registeredAt;
        bool isActive;
    }

    AgentProfile public currentJudge;

    
    event JudgeRegistered(address indexed judgeAddress, string name, string metadataURI);
    event JudgeUpdated(address indexed oldAddress, address indexed newAddress);

    
    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @notice Registers the AI Agent's identity for the first time.
     * @param _judgeAddress The public key of the AI Agent.
     * @param _name Human-readable name for the agent.
     * @param _metadataURI Link to the agent's "Passport" data (ERC-8004 spec).
     */
    function registerJudge(
        address _judgeAddress, 
        string calldata _name, 
        string calldata _metadataURI
    ) external onlyOwner {
        if (_judgeAddress == address(0)) revert InvalidAddress();

        currentJudge = AgentProfile({
            judgeAddress: _judgeAddress,
            name: _name,
            metadataURI: _metadataURI,
            registeredAt: block.timestamp,
            isActive: true
        });

        emit JudgeRegistered(_judgeAddress, _name, _metadataURI);
    }

   
    function updateJudgeAddress(address _newAddress) external onlyOwner {
        if (_newAddress == address(0)) revert InvalidAddress();
        
        address oldAddress = currentJudge.judgeAddress;
        currentJudge.judgeAddress = _newAddress;

        emit JudgeUpdated(oldAddress, _newAddress);
    }

   
    function setStatus(bool _status) external onlyOwner {
        currentJudge.isActive = _status;
    }

   
    function isVerifiedJudge(address _addr) external view returns (bool) {
        return (currentJudge.isActive && _addr == currentJudge.judgeAddress);
    }
}