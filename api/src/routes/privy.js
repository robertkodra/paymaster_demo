const express = require("express");
const router = express.Router();
const { getPrivyClient } = require("../lib/privyClient");
const {
  computeReadyAddress,
  deployReadyWithPrivySigner,
} = require("../lib/ready");

// Create Starknet wallet (user-owned if ownerId provided)
router.post("/create-wallet", async (req, res) => {
  try {
    const authUserId = req.auth?.userId;
    const { chainType, ownerId } = req.body || {};
    const privy = getPrivyClient();
    const policyId = process.env.PRIVY_WALLET_POLICY_ID;
    const payload = {
      chainType: chainType || "starknet",
      ...(policyId ? { policyIds: [policyId] } : {}),
      ...(ownerId || authUserId
        ? { owner: { userId: ownerId || authUserId } }
        : {}),
    };
    const result = await privy.walletApi.createWallet(payload);
    return res.status(200).json({ wallet: result });
  } catch (error) {
    console.error("Error creating Privy wallet:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to create Privy wallet" });
  }
});

// Get public key by wallet ID
router.post("/public-key", async (req, res) => {
  try {
    const { walletId, userJwt } = req.body || {};
    if (!walletId)
      return res.status(400).json({ error: "walletId is required" });
    const privy = getPrivyClient();
    const wallet = await privy.walletApi.getWallet({ id: walletId });
    return res
      .status(200)
      .json({ public_key: wallet.public_key || wallet.publicKey, wallet });
  } catch (error) {
    console.error("Error fetching Privy wallet:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch Privy wallet" });
  }
});

// Deploy Ready account for a given wallet ID (requires STRK funded address)
router.post("/deploy-wallet", async (req, res) => {
  try {
    const { walletId, userJwt } = req.body || {};
    if (!walletId)
      return res.status(400).json({ error: "walletId is required" });
    const classHash = process.env.READY_CLASSHASH;
    if (!classHash)
      return res.status(500).json({ error: "READY_CLASSHASH not configured" });

    const privy = getPrivyClient();

    const wallet = await privy.walletApi.getWallet({ id: walletId });
    const chain = wallet?.chainType || wallet?.chain_type;

    if (!wallet || !chain || !["starknet"].includes(chain)) {
      return res
        .status(400)
        .json({ error: "Provided wallet is not a Starknet wallet" });
    }
    // Ensure wallet belongs to authenticated user
    const authUserId = req.auth?.userId;
    if (wallet.ownerId && authUserId && wallet.ownerId !== authUserId) {
      return res
        .status(403)
        .json({ error: "Wallet does not belong to authenticated user" });
    }
    const publicKey = wallet.public_key || wallet.publicKey;
    if (!publicKey || typeof publicKey !== "string") {
      return res
        .status(400)
        .json({ error: "Wallet missing Starknet public key" });
    }
    // Always compute contract address from the configured class hash and public key.
    // Privy returns an address assuming Ready v0.5.0; if using a different class hash, prefer the derived address.
    const derived = computeReadyAddress(publicKey);
    const address = derived;

    const deployResult = await deployReadyWithPrivySigner({
      walletId,
      publicKey,
      classHash,
    });

    return res.status(200).json({
      walletId,
      address,
      publicKey,
      transactionHash: deployResult.transaction_hash,
    });
  } catch (error) {
    console.error("Error deploying Ready account:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to deploy Ready account" });
  }
});

// Get all Starknet wallets for a Privy user and include public keys
router.get("/user-wallets", async (req, res) => {
  try {
    const { userId } = req.query || {};
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const privy = getPrivyClient();
    const user = await privy.getUserById(userId);
    const accounts = user?.linkedAccounts || user?.linked_accounts || [];
    const starkWallets = accounts.filter(
      (acc) => acc?.type === "wallet" && acc?.chain_type === "starknet"
    );
    const wallets = await Promise.all(
      starkWallets.map(async (acc) => {
        try {
          const w = await privy.walletApi.getWallet({ id: acc.id });
          const classHash = process.env.READY_CLASSHASH;
          const publicKey = w.public_key || w.publicKey;
          const address =
            w.address ||
            (publicKey && classHash
              ? computeReadyAddress(publicKey)
              : undefined);
          return {
            id: w.id,
            address,
            chainType: w.chain_type || w.chainType,
            publicKey,
          };
        } catch (e) {
          return {
            id: acc.id,
            address: acc.address,
            chainType: acc.chain_type || "starknet",
          };
        }
      })
    );
    return res.status(200).json({ wallets });
  } catch (error) {
    console.error("Error fetching user wallets:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch user wallets" });
  }
});

module.exports = router;
