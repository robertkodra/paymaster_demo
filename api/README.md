# API (Express + TypeScript)

This service exposes endpoints to create Privy wallets, query wallet details, and deploy a Ready account on Starknet using starknet.js.

## Quick start

Prerequisites
- Node.js 18+

Install and run
```
cd api
npm install
cp .env.example .env    # or .env.local
npm run dev             # tsx watch
```

Production
```
npm run build
npm start
```

Env loading order
- api/.env.local, api/.env, then repo root .env.local/.env (first match wins)

## Environment variables

Required
- RPC_URL – Starknet RPC (e.g., Sepolia v0_8)
- READY_CLASSHASH – Ready account class hash
- PRIVY_APP_ID – Privy app id
- PRIVY_APP_SECRET – Privy app secret

Optional
- PRIVY_WALLET_AUTH_PRIVATE_KEY – Privy Wallet API authorization key
- PRIVY_WALLET_POLICY_ID – policy id to apply on wallet creation
- PORT – default 3000
- CLIENT_URL – default http://localhost:3001

## Endpoints

Health
- GET / → status and available endpoints

Wallets
- POST /privy/create-wallet → creates a Starknet wallet in Privy (owner attached if available)
- POST /privy/public-key → body: { walletId } → returns wallet + public key
- GET  /privy/user-wallets?userId=… → returns Starknet wallets for a user

Deploy
- POST /privy/deploy-wallet → body: { walletId } → deploys Ready account (address is derived from public key + class hash)

Notes
- The account address must be funded with STRK before deployment.
- Privy server API calls require valid app credentials.
