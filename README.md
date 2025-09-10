# Starknet + Privy Ready Wallet Demo

Minimal full‑stack demo for creating Privy wallets and deploying Ready accounts on Starknet (Sepolia) with Privy authentication. The project is split into two independent apps:

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
3. npm run dev

Access:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000

## Notes

- Fund the computed Starknet address with STRK before deploying (no paymaster in this demo).
- The API uses Basic (app id/secret) and user authorization signatures to call Privy Wallet API; Origin is forwarded.
- The codebase favors clarity and minimal dependencies; server and client run independently for easier debugging.

## License

MIT — see LICENSE
