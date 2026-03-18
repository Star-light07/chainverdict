# ChainVerdict ⚖️

**No middlemen. No delays. Just a clear verdict.**

I built this for the Celo Build Agents for the Real World Hackathon V2 (March 2026). The idea is simple — freelance disputes are broken, especially in emerging markets. Escrow holds the money but someone still has to decide who gets it. ChainVerdict makes that someone an AI agent.

## How it works

1. Client posts a job and locks cUSD in the escrow contract
2. Freelancer does the work
3. Dispute gets raised on-chain
4. AI agent detects the event, reads the evidence, calls Gemini
5. Verdict gets executed on-chain with full reasoning — automatically

## Contracts (Celo Mainnet)

- **AgentEscrow:** `0x6188A95d23792045dcBE06f705E018a9d9Ed54A7`
- **JudgeIdentity:** `0x26607DfD08EcCE91AaAb8ECde87a4eD5901A6DE7`

Both verified on Celoscan.

## Stack

- Solidity + Foundry + OpenZeppelin v5
- Python + web3.py for the agent
- **AI:** Claude (Anthropic) — claude-haiku-4-5
- React frontend
- Celo Mainnet, cUSD payments

## 🎥 Demo
[![ChainVerdict Demo](https://img.youtube.com/vi/AYlXIZzZg54/0.jpg)](https://youtu.be/AYlXIZzZg54)

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