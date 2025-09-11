# Starknet + Privy Ready Wallet Demo

Minimal full‑stack demo for creating Privy wallets and deploying Ready accounts on Starknet (Sepolia) with Privy authentication. It also includes an optional SNIP‑29 paymaster path and a simple Counter example (read + write).

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
- A Ready wallet class hash for your target network

## Setup

Backend (API):

1. cd api && npm install
2. cp .env.example .env (or .env.local) and set:
   - PORT, CLIENT_URL
   - RPC_URL
   - READY_CLASSHASH
   - PRIVY_APP_ID, PRIVY_APP_SECRET
   - (optional) PRIVY_WALLET_AUTH_PRIVATE_KEY
   - (optional) PAYMASTER_URL, PAYMASTER_MODE, PAYMASTER_API_KEY, GAS_TOKEN_ADDRESS
   - (optional) CONTRACT_ADDRESS, CONTRACT_ENTRY_POINT_GET_COUNTER
3. npm run dev

Environment loading for API:

- The server loads env in this order (first match wins):
  - api/.env.local, api/.env, repo-root/.env.local, repo-root/.env
  - In production, prefer real environment variables over files.

Frontend (client):

1. cd client && npm install
2. cp .env.example .env.local and set:
   - NEXT_PUBLIC_PRIVY_APP_ID
   - NEXT_PUBLIC_API_URL
   - NEXT_PUBLIC_CONTRACT_ADDRESS (counter demo)
   - (optional) NEXT_PUBLIC_EXPLORER_TX_BASE (defaults to Voyager Sepolia)
3. npm run dev

Access:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000

## Notes

- Deploy uses the Privy Wallet API (user‑signed raw_sign). If a paymaster is configured, deployment + first call can be sponsored; otherwise ensure the account has funds.
- The API uses Basic (app id/secret) and user authorization signatures to call the Privy Wallet API; Origin is forwarded.
- Client caches wallet state per Privy user. On logout or when a different user signs in, cached wallet state is cleared.
- The codebase favors clarity and minimal dependencies; server and client run independently for easier debugging.

## Demo Flow

- Login with Privy on the frontend
- Create Wallet → backend creates a Privy Starknet wallet and returns ids/keys
- Deploy Wallet → backend deploys Ready account (with paymaster if configured)
- Counter → the UI polls `get_counter(user)` every second and shows a big number
- Increase → sends a transaction to `increase_counter`; a toast shows tx link

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
