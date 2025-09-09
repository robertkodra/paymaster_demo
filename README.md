# Starknet + Privy Paymaster Demo

This repository contains a minimal full‑stack demo for creating and deploying Ready wallets on Starknet with Privy authentication. The project is split into two independent apps:

- api/ – Express backend (port 3000). Handles Privy server calls and Starknet account deployment via starknet.js.
- client/ – Next.js frontend (port 3001). Handles login via Privy and simple wallet actions.

## Project Structure

```
paymaster_demo/
├─ api/                # Express backend (starknet.js)
│  ├─ server.js        # App entry
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
1) cd api && npm install
2) cp .env.example .env (or .env.local) and set:
   - PORT, CLIENT_URL
   - RPC_URL
   - READY_CLASSHASH
   - PRIVY_APP_ID, PRIVY_APP_SECRET
   - (optional) PRIVY_WALLET_AUTH_PRIVATE_KEY
3) npm run dev

Frontend (client):
1) cd client && npm install
2) cp .env.example .env.local and set:
   - NEXT_PUBLIC_PRIVY_APP_ID
   - NEXT_PUBLIC_API_URL
3) npm run dev

Access:
- Frontend: http://localhost:3001
- Backend:  http://localhost:3000

## Notes

- Wallet deployment requires funding the computed Starknet address on the chosen network.
- Privy server API calls require correct app credentials. Some endpoints may also require a Privy Wallet Authorization key.
- The codebase favors clarity and minimal dependencies; server and client run independently for easier debugging.

## License

MIT — see LICENSE
