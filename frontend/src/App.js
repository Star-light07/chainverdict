import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';


const ESCROW_ADDRESS = "0x6188A95d23792045dcBE06f705E018a9d9Ed54A7";
const TEST_JOB_ID = 11; 
const CELO_GREEN = "#35D07F";
const DARK_BG = "#0D1117";

const ABI = [
  "function jobs(uint256) view returns (address, address, address, uint256, uint256, uint256, uint8, string)",
  "function raiseDispute(uint256) external",
  "event DisputeRaised(uint256 indexed jobId)",
  "event VerdictRendered(uint256 indexed jobId, address winner, string reasoning)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); 
  const [verdict, setVerdict] = useState({ winner: '', reasoning: '' });
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Fetch On-Chain State & Historical Events ---
  const fetchJobStatus = useCallback(async (userAccount) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, provider);
      
      const job = await contract.jobs(TEST_JOB_ID);
      const status = Number(job[6]);
      setJobStatus(status);

    
      if (status === 2) {
        const logs = await contract.queryFilter("VerdictRendered", -10000);
        const match = logs.find(log => Number(log.args.jobId) === TEST_JOB_ID);
        
        if (match) {
          setVerdict({ winner: match.args.winner, reasoning: match.args.reasoning });
          setTxHash(match.transactionHash);
        }
      }
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  }, []);

const connectWallet = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Force switch to Celo Mainnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa4ec' }], // 42220 in hex = Celo Mainnet
      });
    } catch (err) {
      console.error("Network switch failed:", err);
    }

    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    await fetchJobStatus(accounts[0]);
  }
};

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!account) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, provider);

    contract.on("VerdictRendered", (jobId, winner, reasoning, event) => {
  if (Number(jobId) === TEST_JOB_ID) {
    setVerdict({ winner, reasoning });
    setTxHash(event.log?.transactionHash || event.transactionHash || "");
    setJobStatus(2);
    setLoading(false);
  }
});

    return () => contract.removeAllListeners();
  }, [account]);

  useEffect(() => {
  if (jobStatus !== 1) return;
  const interval = setInterval(async () => {
    await fetchJobStatus();
  }, 3000);
  return () => clearInterval(interval);
}, [jobStatus, fetchJobStatus]);

  // --- User Action: Raise Dispute ---
  const handleDispute = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, signer);

      const tx = await contract.raiseDispute(TEST_JOB_ID);
      
      // Receipt Capture (Auditor approved)
      const receipt = await tx.wait();
      setTxHash(receipt.hash); 
      
      setJobStatus(1);
    } catch (err) {
      console.error("Transaction failed:", err);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>CHAINVERDICT // MAINNET_TERMINAL</div>
        {account ? (
          <div style={styles.address}>{account.toLowerCase()}</div>
        ) : (
          <button onClick={connectWallet} style={styles.connectBtn}>[ CONNECT_ID ]</button>
        )}
      </header>

      <main style={styles.main}>
        {!account ? (
          <div style={styles.hero}>WAITING FOR IDENTITY_AUTH...</div>
        ) : (
          <div style={styles.workspace}>
            
            {jobStatus === 0 && (
              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>CASE_FILE_00{TEST_JOB_ID}</h2>
                <div style={styles.dataRow}><span>OBJECT:</span> <span>On-Chain Services</span></div>
                <button onClick={handleDispute} disabled={loading} style={styles.actionBtn}>
                   {loading ? "INITIALIZING_DISPUTE..." : "RAISE_DISPUTE"}
                </button>
              </div>
            )}

            {jobStatus === 1 && (
              <div style={styles.analyzingPanel}>
                <div className="pulse" style={styles.pulseText}>⚖️ AGENT_JUDGE_ANALYZING_CHAIN_DATA...</div>
                <p style={styles.subtext}>CLAUDE_3.5_SONNET IS REVIEWING METADATA: ID_00{TEST_JOB_ID}</p>
                {txHash && (
                   <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={styles.sublink}>
                     [ VIEW_DISPUTE_TX: {txHash.substring(0,12)}... ]
                   </a>
                )}
              </div>
            )}

            {jobStatus === 2 && (
              <div style={styles.judicialRuling}>
                <h1 style={styles.rulingTitle}>FINAL JUDICIAL VERDICT</h1>
                <hr style={styles.hr} />
                <div style={styles.winnerBox}>WINNER: {verdict.winner}</div>
                <div style={styles.reasoningContent}>"{verdict.reasoning}"</div>
                {txHash && (
                  <div style={{ marginTop: '15px' }}>
                    <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={styles.directLink}>
                      [ VERIFIED_ON_CELOSCAN: {txHash.substring(0, 14)}... ]
                    </a>
                  </div>
                )}
                <hr style={styles.hr} />
                <div style={styles.footer}>STAMPED_ON_CHAIN // CELO_MAINNET</div>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        .pulse { animation: pulse 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { backgroundColor: DARK_BG, color: 'white', minHeight: '100vh', fontFamily: 'monospace', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #30363d', paddingBottom: '10px', marginBottom: '40px' },
  brand: { color: CELO_GREEN, fontWeight: 'bold' },
  address: { color: '#8b949e', fontSize: '0.7rem' },
  connectBtn: { background: 'transparent', border: `1px solid ${CELO_GREEN}`, color: CELO_GREEN, padding: '5px 15px', cursor: 'pointer' },
  main: { display: 'flex', justifyContent: 'center' },
  workspace: { width: '100%', maxWidth: '800px' },
  panel: { border: '1px solid #30363d', padding: '30px', backgroundColor: '#161b22' },
  panelTitle: { color: CELO_GREEN, marginTop: 0 },
  dataRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  actionBtn: { width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  analyzingPanel: { textAlign: 'center', padding: '60px' },
  pulseText: { fontSize: '1.2rem', color: CELO_GREEN },
  subtext: { color: '#8b949e', fontSize: '0.8rem', marginTop: '10px' },
  sublink: { color: CELO_GREEN, fontSize: '0.7rem', textDecoration: 'none' },
  judicialRuling: { border: '4px double black', padding: '40px', backgroundColor: 'white', color: 'black', textAlign: 'center' },
  rulingTitle: { margin: 0, fontSize: '1.5rem', letterSpacing: '2px' },
  winnerBox: { margin: '20px 0', padding: '10px', border: '1px solid black', fontWeight: 'bold' },
  reasoningContent: { fontStyle: 'italic', margin: '20px 0', lineHeight: '1.4' },
  hr: { border: '0', borderTop: '1px solid black', margin: '20px 0' },
  footer: { fontSize: '0.6rem', color: '#666' },
  directLink: { color: '#444', fontSize: '0.7rem', textDecoration: 'underline' }
};

export default App;