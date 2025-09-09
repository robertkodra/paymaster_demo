const { PrivyClient } = require("@privy-io/server-auth");

let client;

function getPrivyClient() {
  if (client) return client;
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing PRIVY_APP_ID or PRIVY_APP_SECRET");
  }
  client = new PrivyClient(appId, appSecret);
  const authKey = process.env.PRIVY_WALLET_AUTH_PRIVATE_KEY;
  if (authKey) {
    try {
      client.walletApi.updateAuthorizationKey(authKey);
    } catch (e) {
      console.warn("Failed to set Privy wallet authorization key:", e?.message);
    }
  } else {
    console.warn(
      "PRIVY_WALLET_AUTH_PRIVATE_KEY not set; server-side wallet RPC will be unauthorized."
    );
  }
  return client;
}

module.exports = { getPrivyClient };
