# Starknet Privy (Tier‑2) Client

Next.js frontend showing a minimal Privy Tier‑2 integration for creating a Privy wallet and deploying a Ready account on Starknet. The app logs in with Privy and calls the backend to deploy using Privy Wallet API raw_sign.

## 🚀 Quick Start

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

# (Optional) API connection for future server features
NEXT_PUBLIC_API_URL=http://localhost:3000

# Ready account class hash (required)
NEXT_PUBLIC_READY_CLASSHASH=0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f

# (Optional) Custom Starknet RPC (defaults to Sepolia v0_8)
# NEXT_PUBLIC_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8
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

## ✨ Features

- 🔐 Privy login (embedded wallet)
- 🧱 Create Privy Starknet wallet and fetch public key
- 🚀 Deploy Ready account via backend using raw_sign
- 🎨 Minimal UI with Tailwind

## 🎯 Usage

1. Open `http://localhost:3001`
2. Login with Privy
3. Click “Create Wallet” — a Privy Starknet wallet is created (if you don’t already have one)
4. The app shows the Starknet public key/address; fund the address with STRK on Sepolia
5. Click “Deploy Wallet” — the backend deploys the Ready account using Privy Tier‑2 raw signing

Notes:
- Ensure your Privy app has Tier‑2 Starknet enabled.
- You must fund the account with STRK before deploying.

## ⚙️ Configuration

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

## 🧪 Development

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

## 🔧 Troubleshooting

**Privy authentication not working**
- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is correct
- Check Privy dashboard configuration
- Ensure no extra spaces in environment variables

**Public key / raw signing not working**
- Ensure your Privy app has Tier‑2 Starknet enabled
- Make sure you are logged in and a Privy wallet is available
- Backend must be configured with PRIVY_APP_ID/PRIVY_APP_SECRET and READY_CLASSHASH

**Build errors**
- Run `npm run type-check` to identify TypeScript issues
- Ensure all environment variables are set

## 🛠️ Tech Stack

- Next.js 14
- Privy React SDK
- Tailwind CSS
- TypeScript

## 📱 Supported Authentication Methods

- Email/Password
- Google
- Twitter
- Discord
- External wallets (MetaMask, etc.)

## 📄 License

MIT
