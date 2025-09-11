import { RpcProvider, PaymasterRpc } from 'starknet'

const providerCache = new Map<string, RpcProvider>()
let cachedPaymaster: PaymasterRpc | null = null

export function getRpcProvider(opts?: { blockIdentifier?: 'pre_confirmed' | 'latest' | 'pending' }): RpcProvider {
  const rpcUrl = process.env.RPC_URL as string
  if (!rpcUrl) throw new Error('Missing RPC_URL')
  const key = `${rpcUrl}|${opts?.blockIdentifier || ''}`
  const existing = providerCache.get(key)
  if (existing) return existing
  const provider = new RpcProvider({ nodeUrl: rpcUrl, ...(opts?.blockIdentifier ? { blockIdentifier: opts.blockIdentifier } : {}) })
  providerCache.set(key, provider)
  return provider
}

export function getPaymasterRpc(): PaymasterRpc {
  if (cachedPaymaster) return cachedPaymaster
  const url = process.env.PAYMASTER_URL || 'https://sepolia.paymaster.avnu.fi'
  const headers: Record<string, string> | undefined = process.env.PAYMASTER_API_KEY
    ? { 'x-paymaster-api-key': process.env.PAYMASTER_API_KEY as string }
    : undefined
  cachedPaymaster = new PaymasterRpc(headers ? { nodeUrl: url, headers } : { nodeUrl: url })
  return cachedPaymaster
}

export async function setupPaymaster(): Promise<{ paymasterRpc: PaymasterRpc; isSponsored: boolean; gasToken?: string }> {
  const isSponsored = (process.env.PAYMASTER_MODE || 'sponsored').toLowerCase() === 'sponsored'
  if (isSponsored && !process.env.PAYMASTER_API_KEY) {
    throw new Error("PAYMASTER_API_KEY is required when PAYMASTER_MODE is 'sponsored'")
  }
  const paymasterRpc = getPaymasterRpc()
  const available = await paymasterRpc.isAvailable()
  if (!available) throw new Error('Paymaster service is not available')
  let gasToken: string | undefined
  if (!isSponsored) {
    const supported = await paymasterRpc.getSupportedTokens()
    gasToken = (process.env.GAS_TOKEN_ADDRESS as string) || supported[0]?.token_address
    if (!gasToken) throw new Error('No supported gas tokens available (and GAS_TOKEN_ADDRESS not set)')
  }
  return { paymasterRpc, isSponsored, gasToken }
}

