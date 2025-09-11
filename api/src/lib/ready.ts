import {
  RpcProvider,
  Account,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  hash,
  PaymasterRpc,
  num,
} from "starknet";
import { RawSigner } from "./rawSigner";
import {
  buildAuthorizationSignature,
  getUserAuthorizationKey,
} from "./authorization";
import { type WalletApiRequestSignatureInput } from "@privy-io/server-auth";

function buildReadyConstructor(publicKey: string) {
  const signerEnum = new CairoCustomEnum({ Starknet: { pubkey: publicKey } });
  const guardian = new CairoOption(CairoOptionVariant.None);
  return CallData.compile({ owner: signerEnum, guardian });
}

export function computeReadyAddress(publicKey: string) {
  const calldata = buildReadyConstructor(publicKey);
  return hash.calculateContractAddressFromHash(
    publicKey,
    process.env.READY_CLASSHASH as string,
    calldata,
    0
  );
}

export async function rawSign(
  walletId: string,
  messageHash: string,
  opts: { userJwt: string; userId?: string; origin?: string }
) {
  const appId = process.env.PRIVY_APP_ID;
  if (!appId) throw new Error("Missing PRIVY_APP_ID");
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appSecret) throw new Error("Missing PRIVY_APP_SECRET");
  // Use the documented Wallet API path and keep it consistent for signing and fetch
  const url = `https://api.privy.io/v1/wallets/${walletId}/raw_sign`;
  const body = { params: { hash: messageHash } };

  // Generate or fetch a user-specific authorization key
  const authorizationKey = await getUserAuthorizationKey({
    userJwt: opts.userJwt,
    userId: opts.userId,
  });

  // Build signature for this request per Privy docs
  const sigInput: WalletApiRequestSignatureInput = {
    version: 1,
    method: "POST",
    url,
    body,
    headers: {
      "privy-app-id": appId,
    },
  };
  const signature = buildAuthorizationSignature({
    input: sigInput,
    authorizationKey,
  });

  const headers: Record<string, string> = {
    "privy-app-id": appId,
    "privy-authorization-signature": signature,
    "Content-Type": "application/json",
  };
  // App authentication for Wallet API
  headers["Authorization"] = `Basic ${Buffer.from(
    `${appId}:${appSecret}`
  ).toString("base64")}`;

  if (opts.origin) headers["Origin"] = opts.origin;
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }

  if (!resp.ok)
    throw new Error(data?.error || data?.message || `HTTP ${resp.status}`);
  const sig: string | undefined =
    data?.signature ||
    data?.result?.signature ||
    data?.data?.signature ||
    data?.result?.data?.signature ||
    (typeof data === "string" ? data : undefined);
  if (!sig || typeof sig !== "string")
    throw new Error("No signature returned from Privy");
  return sig.startsWith("0x") ? sig : `0x${sig}`;
}

export async function deployReadyWithPrivySigner({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
}) {
  const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
  const isSponsored =
    (process.env.PAYMASTER_MODE || "sponsored").toLowerCase() === "sponsored";
  if (isSponsored && !process.env.PAYMASTER_API_KEY) {
    throw new Error(
      "PAYMASTER_API_KEY is required when PAYMASTER_MODE is 'sponsored'"
    );
  }

  // Initialize Paymaster RPC with proper options structure
  const paymasterOptions = {
    nodeUrl: process.env.PAYMASTER_URL || "https://sepolia.paymaster.avnu.fi",
  };

  // Add headers if API key is provided for sponsored mode
  if (process.env.PAYMASTER_API_KEY) {
    paymasterOptions.headers = {
      "x-paymaster-api-key": process.env.PAYMASTER_API_KEY,
    };
  }

  const paymasterRpc = new PaymasterRpc(paymasterOptions);

  // Check if paymaster service is available
  const isAvailable = await paymasterRpc.isAvailable();
  if (!isAvailable) {
    throw new Error("Paymaster service is not available");
  }
  console.log("Paymaster service is available");

  // Get supported gas tokens
  const supportedTokens = await paymasterRpc.getSupportedTokens();
  console.log("Supported gas tokens:", supportedTokens.length);

  // Select gas token (ETH or USDC based on configuration)
  const gasToken =
    process.env.GAS_TOKEN_ADDRESS || supportedTokens[0]?.token_address;
  if (!gasToken) {
    throw new Error("No supported gas tokens available");
  }
  console.log("Using gas token:", gasToken);

  const constructorCalldata = buildReadyConstructor(publicKey);
  const contractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    constructorCalldata,
    0
  );

  // Paymaster deployment data requires hex-encoded calldata
  const constructorHex: string[] = (Array.isArray(constructorCalldata)
    ? (constructorCalldata as any[])
    : ([] as any[])
  ).map((v: any) => num.toHex(v));

  const deploymentData = {
    class_hash: classHash,
    salt: publicKey,
    calldata: constructorHex,
    address: contractAddress,
    version: 1,
  } as const;

  const account = new Account({
    provider,
    address: contractAddress,
    signer: new (class extends RawSigner {
      async signRaw(messageHash: string): Promise<[string, string]> {
        const sig = await rawSign(walletId, messageHash, {
          userJwt,
          userId,
          origin,
        });
        const body = sig.slice(2);
        return [`0x${body.slice(0, 64)}`, `0x${body.slice(64)}`];
      }
    })(),
    paymaster: paymasterRpc,
  });

  // Initial call to execute after deployment
  const initialCall = {
    contractAddress: process.env.CONTRACT_ADDRESS,
    entrypoint: process.env.CONTRACT_ENTRY_POINT_GET_COUNTER || "get_counter",
    calldata: CallData.compile([contractAddress]),
  };

  // Prepare paymaster fee details with correct structure
  const paymasterDetails = {
    feeMode: isSponsored
      ? { mode: "sponsored" as const }
      : { mode: "default" as const, gasToken: gasToken },
    deploymentData,
  };

  const deployPayload = {
    classHash,
    contractAddress,
    constructorCalldata,
    addressSalt: publicKey,
  };

  console.log(
    `Processing with paymaster in ${
      isSponsored ? "sponsored" : "default"
    } mode...`
  );

  let maxFee = undefined;

  // Estimate fees if not sponsored
  if (!isSponsored) {
    console.log("Estimating fees...");
    const feeEstimation = await account.estimatePaymasterTransactionFee(
      [initialCall],
      paymasterDetails
    );
    console.log(
      "Estimated fee:",
      feeEstimation.suggested_max_fee_in_gas_token.toString()
    );
    maxFee = feeEstimation.suggested_max_fee_in_gas_token;
  }

  // Execute deployment and initial transaction with paymaster
  console.log("Executing paymaster transaction...");
  const res = await account.executePaymasterTransaction(
    [initialCall],
    paymasterDetails,
    maxFee
  );

  console.log("Transaction hash:", res.transaction_hash);

  return res;
}

export async function getReadyAccountWithPrivySigner({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
}): Promise<{ account: Account; address: string }> {
  const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });

  const constructorCalldata = buildReadyConstructor(publicKey);
  const address = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    constructorCalldata,
    0
  );
  const account = new Account({
    provider,
    address,
    signer: new (class extends RawSigner {
      async signRaw(messageHash: string): Promise<[string, string]> {
        const sig = await rawSign(walletId, messageHash, {
          userJwt,
          userId,
          origin,
        });
        const body = sig.slice(2);
        return [`0x${body.slice(0, 64)}`, `0x${body.slice(64)}`];
      }
    })(),
  });
  return { account, address };
}
