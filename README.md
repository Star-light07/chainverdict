# ChainVerdict ⚖️

**No middlemen. No delays. Just a clear verdict.**

Built for the Celo Build Agents for the Real World Hackathon V2 (March 2026).

Freelance disputes are broken — especially in emerging markets. Escrow holds the money but someone still has to decide who gets it. ChainVerdict makes that someone an AI agent.

## How it works

1. Client posts a job and locks cUSD in the escrow contract
2. Freelancer does the work
3. Either party raises a dispute on-chain
4. The AI agent detects the event, reads the on-chain evidence, and calls Claude
5. Verdict is executed on-chain automatically — with full reasoning, no human required

## Contracts (Celo Mainnet)

- **AgentEscrow:** `0x6188A95d23792045dcBE06f705E018a9d9Ed54A7`
- **JudgeIdentity:** `0x26607DfD08EcCE91AaAb8ECde87a4eD5901A6DE7`

Both verified on Celoscan. Agent registered on [Agentscan (Token ID #1985)](https://agentscan.info/agents/2c2fe62b-9a04-428f-8145-1d33d85e1bc0).

## Stack

- Solidity + Foundry + OpenZeppelin v5
- Python + web3.py — event polling agent
- Claude (Anthropic) — `claude-haiku-4-5` for AI verdicts
- React + ethers.js frontend
- Celo Mainnet, cUSD payments

## 🎥 Demo

[![ChainVerdict Demo](https://img.youtube.com/vi/LL-5ZZDQDeQ/0.jpg)](https://youtu.be/LL-5ZZDQDeQ)

## Running it
```bash
# Contracts
forge build

# Agent
cd agent && pip install -r requirements.txt
python3 judge_agent.py

# Frontend
cd frontend && npm install && npm start
```

## Why I built this

I know what it means when a $50 payment disappears and there's nothing you can do about it. ChainVerdict is the tool I wished existed.