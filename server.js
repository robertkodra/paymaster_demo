const express = require('express');
const { createReadyWallet } = require('./walletService');
require('dotenv').config();

// Validate environment configuration
const requiredEnvVars = ['RPC_URL', 'READY_CLASSHASH', 'CONTRACT_ADDRESS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file configuration');
    process.exit(1);
}

// Validate paymaster configuration
if (process.env.PAYMASTER_MODE === 'sponsored' && !process.env.PAYMASTER_API_KEY) {
    console.error('PAYMASTER_API_KEY is required when using sponsored mode');
    console.error('Please set PAYMASTER_API_KEY or switch to default mode');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Ready Wallet Paymaster Demo is running',
        version: '2.0.0',
        mode: process.env.PAYMASTER_MODE || 'default',
        endpoints: {
            health: 'GET /',
            createWallet: 'POST /create-wallet'
        }
    });
});

// Create Ready Wallet with Starknet.js v8.5.2 Paymaster (SNIP-29)
app.post('/create-wallet', async (req, res) => {
    try {
        console.log(`Creating Ready wallet in ${process.env.PAYMASTER_MODE || 'default'} mode...`);
        const result = await createReadyWallet();
        
        if (result.success) {
            console.log(`Wallet created successfully: ${result.transactionHash}`);
            return res.status(200).json({
                transactionHash: result.transactionHash,
                walletAddress: result.walletAddress,
                publicKey: result.publicKey,
                privateKey: result.privateKey,
                status: result.status,
                gasToken: result.gasToken,
                mode: result.mode
            });
        } else {
            console.error(`Wallet creation failed: ${result.error}`);
            return res.status(500).json({
                error: result.error,
                details: result.details
            });
        }
    } catch (error) {
        console.error("Unexpected error in create-wallet endpoint:", error.message);
        return res.status(500).json({
            error: error.message,
            details: "Unexpected error during wallet creation"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Ready Wallet Paymaster Demo v2.0.0`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Mode: ${process.env.PAYMASTER_MODE || 'default'}`);
    console.log(`Endpoints:`);
    console.log(`   GET  / - Health check`);
    console.log(`   POST /create-wallet - Deploy Ready wallet with paymaster`);
    console.log(`Built with Starknet.js v8.5.2 SNIP-29 paymaster`);
});