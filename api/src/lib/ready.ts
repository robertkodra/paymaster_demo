import { RpcProvider, Account, CallData, CairoOption, CairoOptionVariant, CairoCustomEnum, hash } from 'starknet'
import { RawSigner } from './rawSigner'

function buildReadyConstructor(publicKey: string) {
  const signerEnum = new CairoCustomEnum({ Starknet: { pubkey: publicKey } })
  const guardian = new CairoOption(CairoOptionVariant.None)
  return CallData.compile({ owner: signerEnum, guardian })
}

export function computeReadyAddress(publicKey: string) {
  const calldata = buildReadyConstructor(publicKey)
  return hash.calculateContractAddressFromHash(publicKey, process.env.READY_CLASSHASH as string, calldata, 0)
}

export async function rawSign(walletId: string, messageHash: string) {
  const appId = process.env.PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET
  if (!appId || !appSecret) throw new Error('Missing PRIVY_APP_ID/PRIVY_APP_SECRET')
  const url = `https://api.privy.io/v1/wallets/${walletId}/raw_sign`
  const headers = {
    'privy-app-id': appId,
    'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    'Content-Type': 'application/json',
  }
  const body = { params: { hash: messageHash } }
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  const text = await resp.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error(`Invalid JSON response: ${text}`) }
  if (!resp.ok) throw new Error(data?.error || data?.message || `HTTP ${resp.status}`)
  const sig: string = data?.signature || data?.result?.signature || data?.result || data
  if (!sig || typeof sig !== 'string') throw new Error('No signature returned from Privy')
  return sig.startsWith('0x') ? sig : `0x${sig}`
}

export async function deployReadyWithPrivySigner({ walletId, publicKey, classHash }: { walletId: string, publicKey: string, classHash: string }) {
  const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL })
  const AXConstructorCallData = buildReadyConstructor(publicKey)
  const AXcontractAddress = hash.calculateContractAddressFromHash(publicKey, classHash, AXConstructorCallData, 0)

  const account = new Account({
    provider,
    address: AXcontractAddress,
    signer: new (class extends RawSigner {
      async signRaw(messageHash: string): Promise<[string, string]> {
        const sig = await rawSign(walletId, messageHash)
        const body = sig.slice(2)
        return [`0x${body.slice(0, 64)}`, `0x${body.slice(64)}`]
      }
    })(),
  })

  const res = await account.deployAccount({
    classHash,
    contractAddress: AXcontractAddress,
    constructorCalldata: AXConstructorCallData,
    addressSalt: publicKey,
  })
  return res
}

