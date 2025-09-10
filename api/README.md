# API (Express + TypeScript)

Backend service to create Privy wallets, fetch wallet details, and deploy a Ready account on Starknet using starknet.js. It implements Privy Wallet API raw_sign via user authorization signatures and Basic app auth.

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
- RPC_URL – Starknet RPC (e.g., Sepolia Alchemy v0_8)
- READY_CLASSHASH – Ready account class hash
- PRIVY_APP_ID – Privy app id
- PRIVY_APP_SECRET – Privy app secret

Optional
- PRIVY_WALLET_AUTH_PRIVATE_KEY – Static Wallet API authorization key (not required; using user-signer flow)
- PRIVY_WALLET_POLICY_ID – Policy id to apply on wallet creation
- PORT – default 3000
- CLIENT_URL – default http://localhost:3001
- COUNTER_CONTRACT_ADDRESS – default contract used by increase-counter (and as fallback for counter)
- COUNTER_ENTRYPOINT_GET – overrides read entrypoint name (default get_counter)
- COUNTER_ENTRYPOINT_INCREASE – overrides write entrypoint name (default increase_counter)
  - For convenience, the API also falls back to client envs if present:
    - NEXT_PUBLIC_CONTRACT_ADDRESS
    - NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER
    - NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER

## Endpoints

Health
- GET / → status and available endpoints

Wallets
- POST /privy/create-wallet → creates a Starknet wallet in Privy (owner attached if available)
- POST /privy/public-key → body: { walletId } → returns wallet + public key
- GET  /privy/user-wallets?userId=… → returns Starknet wallets for a user

Deploy
- POST /privy/deploy-wallet → body: { walletId } and Authorization: Bearer <user JWT> → deploys Ready account (address derived from public key + class hash)

Execute
- POST /privy/execute → body: { walletId, call|calls, wait? } with Authorization → executes a Starknet call using the Ready account
- POST /privy/increase-counter → body: { walletId, contractAddress?, wait? } with Authorization → executes `increase_counter` on the counter contract

Read-only helpers
- GET /privy/counter?contract=…&user=… → calls `get_counter(user)` and returns { hex, decimal }

Notes
- Fund the computed address with STRK before deployment (unless using a paymaster, not included here).
- Wallet API calls use Basic (app id/secret) and user authorization signatures; the browser Origin is forwarded.
