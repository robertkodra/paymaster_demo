# Starknet Paymaster API

Backend API for deploying Ready Wallets on Starknet using SNIP-29 paymaster technology.

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- [AVNU API Key](https://avnu.fi) (optional, for sponsored mode)

### Installation

```bash
cd api
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Required
RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
READY_CLASSHASH=0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f
CONTRACT_ADDRESS=0x7468daa991561b5ee177fab22a6bf44a1d69fbb29feb414d95541d003ffdb49

# Paymaster mode
PAYMASTER_MODE=sponsored
PAYMASTER_API_KEY=your_avnu_api_key_here
```

### Run

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 📖 API Endpoints

### Health Check
```http
GET /
```

Response:
```json
{
  "status": "Ready Wallet Paymaster Demo is running",
  "version": "2.0.0",
  "mode": "sponsored"
}
```

### Create Wallet
```http
POST /create-wallet
Content-Type: application/json
```

Response:
```json
{
  "transactionHash": "0x123...",
  "walletAddress": "0x456...",
  "publicKey": "0x789...",
  "privateKey": "0xabc...",
  "status": "SUBMITTED",
  "gasToken": "sponsored",
  "mode": "sponsored"
}
```

## ⚙️ Configuration

### Paymaster Modes

**Sponsored Mode (Recommended)**
```bash
PAYMASTER_MODE=sponsored
PAYMASTER_API_KEY=your_avnu_api_key
```
- dApp pays transaction fees
- Better user experience
- Requires AVNU API key

**Default Mode**
```bash
PAYMASTER_MODE=default
GAS_TOKEN_ADDRESS=0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080
```
- User pays with alternative tokens (ETH/USDC)
- No API key required

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RPC_URL` | Yes | Starknet RPC endpoint |
| `READY_CLASSHASH` | Yes | Ready wallet class hash |
| `CONTRACT_ADDRESS` | Yes | Contract for initial transaction |
| `PAYMASTER_MODE` | Yes | `sponsored` or `default` |
| `PAYMASTER_API_KEY` | Conditional | Required for sponsored mode |
| `GAS_TOKEN_ADDRESS` | Conditional | Required for default mode |
| `PORT` | No | Server port (default: 3000) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:3001) |

## 🔧 Troubleshooting

**"x-paymaster-api-key is invalid"**
- Verify your AVNU API key is correct
- Check for extra spaces

**"balance for gas token is zero"**  
- Switch to sponsored mode, OR
- Fund the wallet address with gas tokens

**CORS errors**
- Check `CLIENT_URL` environment variable
- Ensure frontend is running on correct port

## 🛠️ Tech Stack

- **Express.js 5.1.0** - Web framework
- **Starknet.js 8.5.2** - Starknet integration with SNIP-29 paymaster
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment management

## 📄 License

MIT