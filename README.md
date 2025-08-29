# Ready Wallet Paymaster Demo

A Node.js demo for deploying Ready Wallets on Starknet using Starknet.js\* integration (SNIP-29).

## Features

- **Ready Wallet Deployment** - Deploy Argent Ready wallets with paymaster
- **Dual Payment Modes** - Default (user pays with alt tokens) and Sponsored (dApp pays)
- **SNIP-29 Compatible** - Uses official Starknet.js paymaster implementation
- **Fast Response** - Returns transaction hash immediately without waiting for confirmation
- **Security Validated** - Follows official Starknet.js patterns and safety checks

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- For **sponsored mode**: AVNU API key from [AVNU](https://avnu.fi)
- For **default mode**: Account with gas token balance (ETH/USDC)

## Quick Start

### 1. Installation

```bash
git clone <your-repo>
cd paymaster_demo
npm install
```

### 2. Configuration

```bash
cp .env.sample .env
```

Update `.env` with your configuration:

```bash
# STARKNET NETWORK
RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# READY WALLET
READY_CLASSHASH=0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f

# SMART CONTRACT (for initial transaction)
CONTRACT_ADDRESS=0x7468daa991561b5ee177fab22a6bf44a1d69fbb29feb414d95541d003ffdb49
CONTRACT_ENTRY_POINT_GET_COUNTER=get_counter

# PAYMASTER CONFIGURATION
PAYMASTER_URL=https://sepolia.paymaster.avnu.fi
PAYMASTER_MODE=sponsored  # or 'default'
PAYMASTER_API_KEY=your_avnu_api_key_here

# GAS TOKEN (for default mode)
GAS_TOKEN_ADDRESS=0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080
```

### 3. Run the Demo

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Usage

### Test the API

**Health Check:**

```bash
curl http://localhost:3000
```

**Create Wallet:**

```bash
curl -X POST http://localhost:3000/create-wallet \
  -H "Content-Type: application/json"
```

### Successful Response

```json
{
  "transactionHash": "0x123...",
  "walletAddress": "0x456...",
  "publicKey": "0x789...",
  "privateKey": "0xabc...",
  "status": "SUBMITTED",
  "gasToken": "0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080",
  "mode": "sponsored"
}
```

## Paymaster Modes

### Sponsored Mode (Recommended)

**dApp pays transaction fees**

```bash
PAYMASTER_MODE=sponsored
PAYMASTER_API_KEY=your_avnu_api_key
```

- **No user balance required**
- **Better UX** - users don't need tokens
- **dApp controls costs**
- **Requires valid AVNU API key**

### Default Mode

**User pays with alternative tokens (ETH/USDC instead of STRK)**

```bash
PAYMASTER_MODE=default
GAS_TOKEN_ADDRESS=0x53b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080
```

- **Account must have gas token balance**
- **No API key required**
- **User pays their own fees**

## Architecture

### Components

- `server.js` - Express API server with health check and wallet creation endpoint
- `walletService.js` - Core wallet deployment logic using Starknet.js paymaster
- Uses **Starknet.js v8.5.2** with native SNIP-29 paymaster support
- Deploys **Argent Ready wallets** on Starknet Sepolia

### Flow

1. Generate random key pair
2. Calculate Ready wallet address
3. Initialize Starknet.js Account with PaymasterRpc
4. Build paymaster transaction with deployment data
5. Execute transaction (deploy wallet + initial call)
6. Return transaction hash immediately

## Supported Gas Tokens (Default Mode)

| Token    | Sepolia Address                                                      |
| -------- | -------------------------------------------------------------------- |
| **ETH**  | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` |
| **USDC** | `0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080` |

## Environment Variables

| Variable            | Required    | Description                      |
| ------------------- | ----------- | -------------------------------- |
| `RPC_URL`           | Yes         | Starknet RPC endpoint            |
| `READY_CLASSHASH`   | Yes         | Ready wallet class hash          |
| `CONTRACT_ADDRESS`  | Yes         | Contract for initial transaction |
| `PAYMASTER_URL`     | Yes         | Paymaster service URL            |
| `PAYMASTER_MODE`    | Yes         | `sponsored` or `default`         |
| `PAYMASTER_API_KEY` | Conditional | Required for sponsored mode      |
| `GAS_TOKEN_ADDRESS` | Conditional | Required for default mode        |

## Troubleshooting

### Common Issues

**"x-paymaster-api-key is invalid"**

- Check your AVNU API key is valid and active
- Ensure no extra spaces in the API key

**"balance for gas token is zero"**

- Switch to sponsored mode, OR
- Fund the account with the gas token (ETH/USDC)

**"Account is not compatible with SNIP-9"**

- The Ready wallet class hash should be SNIP-9 compatible
- Verify the `READY_CLASSHASH` is correct

**API hanging/timeout**

- Fixed in v2.0.0 - now returns immediately after transaction submission
- Check transaction status on [Voyager](https://sepolia.voyager.online/)

## Dependencies

- **starknet v8.5.2** - Latest Starknet.js with native paymaster support
- **express v5.1.0** - Web server framework
- **dotenv v17.2.1** - Environment variable management
- **nodemon v3.1.9** - Development auto-reload

## Development

### Testing

```bash
# Test health check
curl http://localhost:3000

# Test wallet creation
curl -X POST http://localhost:3000/create-wallet -H "Content-Type: application/json"
```

### Monitoring

- Check transaction status: [Sepolia Voyager](https://sepolia.voyager.online/)
- View logs in console for debugging

## Security Notes

- **Private keys returned for demo only** - implement proper key management in production
- **API keys in environment** - never commit secrets to git
- **Production deployment** - use proper secret management
- **Rate limiting** - implement rate limits for production APIs

## Standards Compliance

- **SNIP-29** - Paymaster standard compliance
- **SNIP-9** - Outside execution compatibility
- **Starknet.js patterns** - Follows official SDK patterns

## Links

- [Starknet.js Documentation](https://starknetjs.com/)
- [SNIP-29 Paymaster Specification](https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-29.md)
- [AVNU Paymaster Service](https://avnu.fi)
- [Ready Wallet Specification](https://github.com/argentlabs/argent-contracts-starknet)

---
