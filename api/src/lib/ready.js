const {
  RpcProvider,
  Account,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  hash,
} = require("starknet");

const { RawSigner } = require("./rawSigner");

function buildReadyConstructor(publicKey) {
  // sign the { chain_id: CONSTANTS.SN_MAINNET } as the typed data
  const signerEnum = new CairoCustomEnum({ Starknet: { pubkey: publicKey } });
  const guardian = new CairoOption(CairoOptionVariant.None);
  const constructorCalldata = CallData.compile({ owner: signerEnum, guardian });
  return constructorCalldata;
}

function computeReadyAddress(publicKey) {
  const calldata = buildReadyConstructor(publicKey);
  const addr = hash.calculateContractAddressFromHash(
    publicKey,
    process.env.READY_CLASSHASH,
    calldata,
    0
  );
  return addr;
}

// Privy raw sign function
async function rawSign(walletId, messageHash) {
  const url = `https://api.privy.io/v1/wallets/${walletId}/raw_sign`;

  // Basic Auth: base64(appId:appSecret)
  const authString = Buffer.from(
    `${process.env.PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`
  ).toString("base64");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${authString}`,
    "privy-app-id": process.env.PRIVY_APP_ID,
  };

  // Per docs, body must be { params: { hash: <0x...> } }
  const body = {
    params: {
      hash: messageHash,
    },
  };

  console.log("body", body);

  try {
    console.log("fetching", url);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    console.log("resp", resp);
    const text = await resp.text();
    let data;
    console.log("here1");
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text}`);
    }
    console.log("here2");
    if (!resp.ok) {
      const reason =
        data?.error || data?.message || text || `HTTP ${resp.status}`;
      throw new Error(`Raw sign failed: ${reason}`);
    }
    console.log("here3");
    // Handle common response shapes
    const sig =
      data?.signature || data?.result?.signature || data?.result || data;
    if (!sig || typeof sig !== "string") {
      throw new Error("No signature returned from Privy");
    }

    return sig.startsWith("0x") ? sig : `0x${sig}`;
  } catch (error) {
    console.error("Error in rawSign:", error);
    throw error;
  }
}

async function deployReadyWithPrivySigner({ walletId, publicKey, classHash }) {
  // Validate required parameters
  if (!walletId) throw new Error("walletId is required");
  if (!publicKey) throw new Error("publicKey is required");
  if (!classHash) throw new Error("classHash is required");

  let provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });

  const version = await provider.getSpecVersion();
  console.log("Provider nodeUrl:", version);

  // Calculate future address of the ArgentX account
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: publicKey } });
  const axGuardian = new CairoOption(CairoOptionVariant.None);
  const AXConstructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian,
  });
  const AXcontractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    AXConstructorCallData,
    0
  );

  const account = new Account({
    provider,
    address: AXcontractAddress,
    signer: new (class extends RawSigner {
      async signRaw(messageHash) {
        console.log("Signing messageHash:", messageHash);
        const sig = await rawSign(walletId, messageHash);

        const sigWithout0x = sig.slice(2);
        const r = `0x${sigWithout0x.slice(0, 64)}`;
        const s = `0x${sigWithout0x.slice(64)}`;

        console.log("Signature components:", { r, s });

        return [r, s];
      }
    })(),
  });

  console.log(account);
  try {
    console.log("Deploying account...");
    const deployResult = await account.deployAccount({
      classHash: classHash,
      contractAddress: AXcontractAddress,
      constructorCalldata: AXConstructorCallData,
      addressSalt: publicKey,
    });

    console.log("Deploy transaction submitted:", deployResult.transaction_hash);

    // Wait for transaction confirmation
    console.log("Waiting for transaction confirmation...");
    const receipt = await provider.waitForTransaction(
      deployResult.transaction_hash
    );

    return {
      account,
      deployResult,
      contractAddress,
      receipt,
    };
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

module.exports = {
  deployReadyWithPrivySigner,
  computeReadyAddress,
  rawSign,
};
