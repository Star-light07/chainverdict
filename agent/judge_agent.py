import os
import json
import time
from web3 import Web3
from dotenv import load_dotenv
import anthropic

load_dotenv()
W3_RPC_URL = "https://rpc.ankr.com/celo"
ESCROW_ADDRESS = "0x6188A95d23792045dcBE06f705E018a9d9Ed54A7"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABI_PATH = os.path.join(BASE_DIR, 'out/AgentEscrow.sol/AgentEscrow.json')

w3 = Web3(Web3.HTTPProvider(W3_RPC_URL))

if not w3.is_connected():
    raise Exception("Cannot connect to Celo Mainnet.")
print(f"✅ Connected to Celo. Block: {w3.eth.block_number}")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

with open(ABI_PATH, 'r') as f:
    escrow_abi = json.load(f)['abi']

contract = w3.eth.contract(address=ESCROW_ADDRESS, abi=escrow_abi)

def handle_dispute(job_id):
    print(f"⚖️  Reviewing Dispute for Job ID: {job_id}")
    job_description = "Design a minimalist logo for a tech startup."
    deliverable = "A brightly colored 3D cartoon mascot."
    print("🤖 Claude is analyzing the case...")
    prompt = f"""You are an impartial Judge in a freelance dispute.
Job Requirements: {job_description}
Submitted Work: {deliverable}
Return ONLY this JSON with no extra text:
{{"winner": 1, "reasoning": "your explanation"}}
winner 1 = refund client, winner 2 = pay freelancer."""
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        raw_text = response.content[0].text.strip()
        start = raw_text.find('{')
        end = raw_text.rfind('}') + 1
        verdict = json.loads(raw_text[start:end])
        verdict['reasoning'] = verdict['reasoning'][:500]
    except Exception as e:
        print(f"❌ Error: {e}. Defaulting to refund.")
        verdict = {"winner": 1, "reasoning": "Agent parsing error - safety refund."}
    execute_transaction(job_id, verdict)

def execute_transaction(job_id, verdict):
    account = w3.eth.account.from_key(os.getenv("PRIVATE_KEY"))
    if verdict['winner'] == 1:
        tx_func = contract.functions.refundToClient(job_id, verdict['reasoning'])
    else:
        tx_func = contract.functions.releaseToFreelancer(job_id, verdict['reasoning'])
    tx = tx_func.build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 500000,
        'gasPrice': w3.eth.gas_price
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=os.getenv("PRIVATE_KEY"))
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"✅ Mainnet Transaction Sent: {tx_hash.hex()}")

def log_loop(poll_interval):
    print("🛰️  Justice Agent Online. Watching for Disputes...")
    last_block = w3.eth.block_number
    while True:
        try:
            current_block = w3.eth.block_number
            if current_block > last_block:
                events = contract.events.DisputeRaised.get_logs(
                  fromBlock=max(last_block + 1, current_block - 100),
                  toBlock=current_block)
               
                for event in events:
                    handle_dispute(event['args']['jobId'])
                last_block = current_block
            time.sleep(poll_interval)
        except Exception as e:
            print(f"⚠️ Loop error: {e}")
            time.sleep(poll_interval)

if __name__ == "__main__":
    log_loop(2)