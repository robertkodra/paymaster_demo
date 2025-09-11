# Starknet + Privy Client

Next.js frontend for the Ready Wallet demo. It logs in with Privy, calls the backend to create a Privy wallet and deploy a Ready account using the Privy Wallet API (raw_sign), and includes a simple Counter read/write.

## Quick Start

### Prerequisites
- Node.js v18 or higher
- [Privy App ID](https://dashboard.privy.io) (free)

### Installation

```bash
cd client
npm install
```

### Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```bash
# Required - Get from https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Counter demo (read + write)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # counter contract address

# (Optional) Explorer base for tx links
# NEXT_PUBLIC_EXPLORER_TX_BASE=https://sepolia.voyager.online/tx
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Client runs on `http://localhost:3001`

## Features

- Privy login (embedded wallet)
- Create Privy Starknet wallet and fetch public key
- Deploy Ready account via backend (raw_sign; paymaster optional on server)
- Live counter (polls get_counter(user) every second)
- Big “Increase” button sends a transaction; toast shows tx link
- Minimal UI with Tailwind

Notes:
- The Increase button is disabled until a wallet is deployed (prevents failed txs).
- Per-user cache: local state (wallet id/address/public key) is cleared on logout and when a different Privy user signs in.

## Usage

1. Open `http://localhost:3001`
2. Login with Privy
3. Click “Create Wallet” — a Privy Starknet wallet is created (if you don’t already have one)
4. Click “Deploy Wallet” — backend deploys the Ready account (paymaster if configured)
5. The big number shows your counter; smash “Increase” to send a tx

Notes:
- Ensure your Privy app has Starknet Tier‑2/Wallet API enabled.
- If paymaster isn’t configured on the server, deploys and txs require funding the account.

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID from dashboard |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:3000) |

### Getting Privy App ID

1. Visit [Privy Dashboard](https://dashboard.privy.io)
2. Create a free account
3. Create a new app
4. Copy the App ID to your `.env.local`

## Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## Troubleshooting

**Privy authentication not working**
- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is correct
- Check Privy dashboard configuration
- Ensure no extra spaces in environment variables

**Public key / raw signing not working**
- Ensure your Privy app has Starknet Tier‑2/Wallet API enabled
- Make sure you are logged in and a Privy wallet is available
- Backend must be configured with PRIVY_APP_ID/PRIVY_APP_SECRET and READY_CLASSHASH

**Build errors**
- Run `npm run type-check` to identify TypeScript issues
- Ensure all environment variables are set

**Increase button disabled**
- Deploy the wallet first. The button enables only when `Deployed`.

## Tech Stack

- Next.js 14
- Privy React SDK
- Tailwind CSS
- TypeScript

## Authentication Methods

- Email/Password, Google, Twitter, Discord (configurable in Privy)

## License

MIT
