const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'Ready Wallet API running',
    version: '2.0.0',
    endpoints: {
      privyCreate: 'POST /privy/create-wallet',
      privyDeploy: 'POST /privy/deploy-wallet',
      paymasterCreate: 'POST /create-wallet',
    },
  });
});

module.exports = router;

