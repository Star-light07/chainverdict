import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const ESCROW_ADDRESS = "0x6188A95d23792045dcBE06f705E018a9d9Ed54A7";
const TEST_JOB_ID = 2; 
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
  const [loading, setLoading] = useState(false);


  const fetchJobStatus = useCallback(async (userAccount) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, provider);
    const job = await contract.jobs(TEST_JOB_ID);
    
    setJobStatus(Number(job[6]));
    
  
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await fetchJobStatus(accounts[0]);
    }
  };

  useEffect(() => {
    if (!account) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, provider);

    contract.on("VerdictRendered", (jobId, winner, reasoning) => {
      if (Number(jobId) === TEST_JOB_ID) {
        setVerdict({ winner, reasoning });
        setJobStatus(2);
        setLoading(false);
      }
    });

    return () => contract.removeAllListeners();
  }, [account, fetchJobStatus]);

  const handleDispute = async () => {
    setLoading(true);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, signer);

    try {
      const tx = await contract.raiseDispute(TEST_JOB_ID);
      await tx.wait();
      setJobStatus(1);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>CHAINVERDICT // TERMINAL_v1.0</div>
        {account ? (
          <div style={styles.address}>{account.toLowerCase()}</div>
        ) : (
          <button onClick={connectWallet} style={styles.connectBtn}>[ CONNECT_IDENTITY ]</button>
        )}
      </header>

      <main style={styles.main}>
        {!account ? (
          <div style={styles.hero}>W_ALLET_NOT_FOUND. PLEASE INITIALIZE CONNECTION.</div>
        ) : (
          <div style={styles.workspace}>
            
            {/* STATE 0: OPEN */}
            {jobStatus === 0 && (
              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>CASE_FILE_00{TEST_JOB_ID}</h2>
                <div style={styles.dataRow}><span>OBJECT:</span> <span>Logo Design - Tech Startup</span></div>
                <div style={styles.dataRow}><span>STATUS:</span> <span style={{color: CELO_GREEN}}>OPERATIONAL</span></div>
                <button onClick={handleDispute} disabled={loading} style={styles.actionBtn}>
                   {loading ? "COMMITTING_TO_CHAIN..." : "RAISE_DISPUTE"}
                </button>
              </div>
            )}

            {/* STATE 1: DISPUTED */}
            {jobStatus === 1 && (
              <div style={styles.analyzingPanel}>
                <div className="pulse" style={styles.pulseText}>⚖️ AGENT_JUDGE_ANALYZING_EVIDENCE...</div>
                <p style={styles.subtext}>GEMINI_1.5_FLASH IS REVIEWING ON-CHAIN DATA</p>
              </div>
            )}

            {/* STATE 2: RESOLVED */}
            {jobStatus === 2 && (
              <div style={styles.judicialRuling}>
                <h1 style={styles.rulingTitle}>FINAL JUDICIAL VERDICT</h1>
                <hr style={styles.hr} />
                <p style={styles.rulingBody}>
                  The Court (AI Agent ID: 0x266...) has reviewed the evidence provided for Case #0.
                </p>
                <div style={styles.winnerBox}>
                   WINNER: {verdict.winner === account ? "CURRENT_HOLDER" : verdict.winner}
                </div>
                <div style={styles.reasoningContent}>
                  "{verdict.reasoning || "Work does not meet the specified requirements as defined in jobHash metadata."}"
                </div>
                <hr style={styles.hr} />
                <div style={styles.footer}>STAMPED_ON_CHAIN // CELO_MAINNET</div>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        .pulse { animation: pulse 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

const styles = {
  hero: { textAlign: 'center', marginTop: '100px', color: '#8b949e', fontSize: '1rem' },
  container: { backgroundColor: DARK_BG, color: 'white', minHeight: '100vh', fontFamily: 'monospace', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid #30363d`, paddingBottom: '10px', marginBottom: '40px' },
  brand: { fontSize: '1.2rem', fontWeight: 'bold', color: CELO_GREEN },
  address: { color: '#8b949e', fontSize: '0.8rem' },
  connectBtn: { background: 'transparent', border: `1px solid ${CELO_GREEN}`, color: CELO_GREEN, padding: '5px 15px', cursor: 'pointer' },
  main: { display: 'flex', justifyContent: 'center' },
  workspace: { width: '100%', maxWidth: '800px' },
  panel: { border: '1px solid #30363d', padding: '30px', backgroundColor: '#161b22' },
  rulingBody: { fontSize: '0.9rem', color: '#444', margin: '20px 0' },
  panelTitle: { borderBottom: '1px solid #30363d', paddingBottom: '10px', marginTop: 0, color: CELO_GREEN },
  dataRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' },
  actionBtn: { width: '100%', marginTop: '20px', padding: '15px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  analyzingPanel: { textAlign: 'center', padding: '60px' },
  pulseText: { fontSize: '1.5rem', marginBottom: '10px', color: CELO_GREEN },
  subtext: { color: '#8b949e', fontSize: '0.8rem' },
  judicialRuling: { border: '4px double white', padding: '40px', backgroundColor: 'white', color: 'black', textAlign: 'center' },
  rulingTitle: { margin: 0, fontSize: '1.8rem', letterSpacing: '2px' },
  winnerBox: { margin: '20px 0', padding: '10px', border: '1px solid black', fontWeight: 'bold', fontSize: '1.1rem' },
  reasoningContent: { fontStyle: 'italic', margin: '20px 0', lineHeight: '1.5' },
  hr: { border: '0', borderTop: '1px solid black', margin: '20px 0' },
  footer: { fontSize: '0.7rem', color: '#666' }
};

export default App;