import {
  RpcProvider,
  Account,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  hash,
  TipEstimate,
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

  // console.log("resp", resp);
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
  const AXConstructorCallData = buildReadyConstructor(publicKey);
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

  
  // const { suggestedMaxFee: estimatedFee1 } =
  //   await account.estimateAccountDeployFee({
  //     classHash,
  //     contractAddress: AXcontractAddress,
  //     constructorCalldata: AXConstructorCallData,
  //     addressSalt: publicKey,
  //   });

  
  const deployPayload = {
    classHash,
    contractAddress: AXcontractAddress,
    constructorCalldata: AXConstructorCallData,
    addressSalt: publicKey,
  };
  const res = await account.deployAccount(deployPayload);
  return res;
}
