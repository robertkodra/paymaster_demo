const express = require('express');
const { createReadyWallet } = require('./walletService');
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = ['RPC_URL', 'READY_CLASSHASH', 'PAYMASTER_KEY', 'CONTRACT_ADDRESS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Ready wallet demo is running' });
});

// Create Wallet endpoint using AVNU SDK
app.post('/create-wallet', async (req, res) => {
    try {
        const result = await createReadyWallet();
        
        if (result.success) {
            return res.status(200).json({
                transactionHash: result.transactionHash,
                walletAddress: result.walletAddress,
                publicKey: result.publicKey,
                privateKey: result.privateKey
            });
        } else {
            return res.status(500).json({
                error: result.error,
                details: result.details
            });
        }
    } catch (error) {
        console.error("Error in create-wallet endpoint:", error);
        return res.status(500).json({
            error: error.message,
            details: "Failed to create wallet"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('GET  / - Health check');
    console.log('POST /create-wallet - Create a new Ready wallet');
});