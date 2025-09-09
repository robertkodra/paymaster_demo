# Starknet Privy (Tier‑2) Client

Next.js frontend showing a minimal Privy Tier‑2 integration for Starknet raw signing. After logging in with Privy, you can sign a Starknet message hash and see the signature (r, s).

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
- ✍️ Starknet Tier‑2 raw signing demo (sign a message hash)
- 🎨 Minimal UI with Tailwind

## 🎯 Usage

1. Open `http://localhost:3001`
2. Login with Privy
3. Click “1) Get Starknet Public Key” — we compute the Ready account address from your Privy Starknet public key and the Ready class hash
4. Fund the computed address with STRK on Sepolia, tick the checkbox
5. Click “2) Deploy Account” — uses Privy Tier‑2 raw signing to deploy the account
6. Optionally, use “Sign Sample Starknet Hash” to test raw signing

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
- Check the browser console for the exact signature shape returned; the demo normalizes common formats
 - If public key export is unavailable in your SDK version, retrieve the Starknet public key from the Privy API on your backend and inject it into the client.

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
