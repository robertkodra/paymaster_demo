# Ready Wallet Paymaster Demo

A Node.js demo for creating StarkNet wallets using AVNU's gasless SDK with paymaster integration.

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- AVNU API key from https://sepolia.api.avnu.fi

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy `.env.sample` to `.env` and configure:

```bash
cp .env.sample .env
```

3. Update `.env` with your configuration:

- `RPC_URL`: Starknet RPC endpoint (Sepolia testnet)
- `PAYMASTER_KEY`: Your AVNU API key (reach out to them)
- `READY_CLASSHASH`: Ready wallet class hash (default provided) ([more here](https://github.com/argentlabs/argent-contracts-starknet/blob/main/deployments/account.txt))
- `CONTRACT_ADDRESS`: Contract for initial transaction
- `CONTRACT_ENTRY_POINT_GET_COUNTER`: Contract entry point

## Usage

Start the server:

```bash
npm start
```

Check server status:

```bash
curl http://localhost:3000
```

Create a new wallet:

```bash
curl -X POST http://localhost:3000/create-wallet \
  -H "Content-Type: application/json"
```

## Response

Successful wallet creation returns:

```json
{
  "transactionHash": "0x...",
  "walletAddress": "0x...",
  "publicKey": "0x...",
  "privateKey": "0x..."
}
```

## Architecture

The demo consists of:

- `server.js`: Express server with single endpoint
- `walletService.js`: Wallet creation logic using AVNU SDK
- Uses AVNU gasless SDK for paymaster integration
- Deploys Ready wallets on Starknet Sepolia testnet

## Dependencies

- `starknet`: Starknet JavaScript library
- `@avnu/gasless-sdk`: AVNU gasless transaction SDK
- `express`: Web server framework
- `ethers`: Required by AVNU SDK
- `dotenv`: Environment variable management

## Notes

- The demo uses Starknet Sepolia testnet
- Private keys are returned for demo purposes only
- In production, implement proper key management
- Transaction fees are sponsored by the paymaster
