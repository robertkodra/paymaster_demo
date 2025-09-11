# Starknet + Privy Ready Wallet Demo

Minimal full‑stack demo for creating Privy wallets and deploying Argent Ready accounts on Starknet (Sepolia) with Privy authentication. Includes an optional SNIP‑29 paymaster path and a simple Counter example (read + write).

The project is split into two independent apps:

- api/ – Express backend (port 3000). Handles Privy server calls and Starknet account deployment via starknet.js.
- client/ – Next.js frontend (port 3001). Handles login via Privy and simple wallet actions.

## Project Structure

```
ready_wallet_demo/
├─ api/                # Express backend (starknet.js)
│  ├─ server.ts        # App entry
│  ├─ src/             # Routes, libs, middleware
│  └─ .env.example     # API env template
└─ client/             # Next.js frontend (Privy auth)
   ├─ src/             # Pages and components
   └─ .env.example     # Client env template
```

## Requirements

- Node.js 18+
- A Privy App (App ID/Secret)
- A Ready account class hash for your target network

## Quick Start

API (backend)

```bash
cd api
npm install
cp .env.example .env    # or .env.local
# Edit .env (see examples below)
npm run dev
```

Client (frontend)

```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local (see examples below)
npm run dev
```

Access

```
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```

## Environment

API minimal .env

```env
PORT=3000
CLIENT_URL=http://localhost:3001

# Starknet
RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8
READY_CLASSHASH=0x...

# Privy server credentials
PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_app_secret

# Counter (used by demo endpoints)
COUNTER_CONTRACT_ADDRESS=0x...
COUNTER_ENTRYPOINT_GET=get_counter
COUNTER_ENTRYPOINT_INCREASE=increase_counter

# Paymaster (optional)
# PAYMASTER_URL=https://sepolia.paymaster.avnu.fi
# PAYMASTER_MODE=sponsored   # or 'default'
# PAYMASTER_API_KEY=...      # required for sponsored
# GAS_TOKEN_ADDRESS=0x...    # required for default
```

Client minimal .env.local

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_API_URL=http://localhost:3000

# Counter (UI uses this if API did not set COUNTER_CONTRACT_ADDRESS)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Optional explorer base (defaults to Voyager Sepolia)
# NEXT_PUBLIC_EXPLORER_TX_BASE=https://sepolia.voyager.online/tx
```

Environment loading for API

- The server loads env in this order (first match wins):
  - api/.env.local, api/.env, repo-root/.env.local, repo-root/.env
  - In production, prefer real environment variables over files.

## How It Works (Learning Notes)

- Privy wallet: Create a Starknet wallet in Privy for the user. We use Privy’s Wallet API with user authorization (raw_sign) to sign Starknet messages.
- Ready account: An Argent Ready account is deployed on Starknet. Its address is derived from the class hash and the user’s public key.
- Paymaster (optional): If configured, deploy/txs can be sponsored (dApp pays) or use a gas token in “default” mode.
- Counter: A simple contract used for demo. The UI polls `get_counter(user)` every second and sends `increase_counter` when you click Increase.
- Safety: The Increase button is disabled until the wallet is deployed.

## Verify With cURL

Create wallet

```bash
curl -X POST http://localhost:3000/privy/create-wallet \
  -H 'Content-Type: application/json' \
  -d '{"ownerId":"<privy_user_id>","chainType":"starknet"}'
```

Get public key

```bash
curl -X POST http://localhost:3000/privy/public-key \
  -H 'Content-Type: application/json' \
  -d '{"walletId":"<wallet_id>"}'
```

Deploy Ready account (requires user JWT)

```bash
curl -X POST http://localhost:3000/privy/deploy-wallet \
  -H 'Authorization: Bearer <user_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"walletId":"<wallet_id>"}'
```

Read counter

```bash
curl "http://localhost:3000/privy/counter?contract=<counter_addr>&user=<ready_addr>"
``;

Increase counter (requires user JWT)

```bash
curl -X POST http://localhost:3000/privy/increase-counter \
  -H 'Authorization: Bearer <user_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"walletId":"<wallet_id>","contractAddress":"<counter_addr>","wait":true}'
```

## Demo Flow

- Login with Privy on the frontend.
- Create Wallet → backend creates a Privy Starknet wallet and returns ids/keys.
- Deploy Wallet → backend deploys Ready account (with paymaster if configured).
- Counter → the UI polls `get_counter(user)` every second and shows a big number.
- Increase → sends a transaction to `increase_counter`; a toast shows tx link.

## Endpoints (API)

- POST `/privy/create-wallet`
- POST `/privy/public-key`
- GET  `/privy/user-wallets?userId=…`
- POST `/privy/deploy-wallet`
- POST `/privy/execute`
- POST `/privy/increase-counter`
- GET  `/privy/counter?contract=…&user=…`

## License

MIT — see LICENSE
