import os
import json
import time
from web3 import Web3
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. Setup & Environment
load_dotenv()
W3_RPC_URL = "https://forno.celo.org"
ESCROW_ADDRESS = "0x6188A95d23792045dcBE06f705E018a9d9Ed54A7"

# Patch: Dynamic ABI Pathing
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABI_PATH = os.path.join(BASE_DIR, 'out/AgentEscrow.sol/AgentEscrow.json')

w3 = Web3(Web3.HTTPProvider(W3_RPC_URL))

# Patch: Connection Check (Claude's fix)
if not w3.is_connected():
    raise Exception("❌ Cannot connect to Celo Mainnet. Check RPC URL.")
print(f"✅ Connected to Celo. Block: {w3.eth.block_number}")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

with open(ABI_PATH, 'r') as f:
    escrow_abi = json.load(f)['abi']

contract = w3.eth.contract(address=ESCROW_ADDRESS, abi=escrow_abi)

def handle_dispute(job_id):
    print(f"⚖️  Reviewing Dispute for Job ID: {job_id}")
    
    job_data = contract.functions.jobs(job_id).call()
    
    # Placeholder Context
    job_description = "Design a minimalist logo for a tech startup."
    deliverable = "A brightly colored 3D cartoon mascot." 

    print("🤖 Gemini is analyzing the case...")
    
    response_schema = {
        "type": "object",
        "properties": {
            "winner": {"type": "integer", "description": "1 for Client, 2 for Freelancer"},
            "reasoning": {"type": "string", "description": "Justification"}
        },
        "required": ["winner", "reasoning"]
    }

    # Patch: Validated Model Name
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=f"Analyze requirements: {job_description} vs. Work: {deliverable}",
        config=types.GenerateContentConfig(
            system_instruction="You are an impartial Judge in a freelance dispute.",
            response_mime_type="application/json",
            response_schema=response_schema
        )
    )
    
    try:
        verdict = json.loads(response.text)
        # Patch: Gas Safety Truncation
        verdict['reasoning'] = verdict['reasoning'][:500]
    except Exception as e:
        print(f"❌ Gemini JSON error: {e}. Defaulting to client refund.")
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
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"✅ Mainnet Transaction Sent: {tx_hash.hex()}")

def log_loop(poll_interval):
    print("🛰️  Justice Agent Online. Watching for Disputes...")
    last_block = w3.eth.block_number
    while True:
        current_block = w3.eth.block_number
        if current_block > last_block:
            events = contract.events.DisputeRaised.get_logs(
                fromBlock=last_block + 1,
                toBlock=current_block
            )
            for event in events:
                handle_dispute(event['args']['jobId'])
            last_block = current_block
        time.sleep(poll_interval)
        

if __name__ == "__main__":
    log_loop(2)