import { Router, Request, Response } from 'express'
import { getPrivyClient } from '../lib/privyClient'
import { computeReadyAddress, deployReadyWithPrivySigner } from '../lib/ready'

const router = Router()

router.post('/create-wallet', async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).auth?.userId as string | undefined
    const { chainType, ownerId } = (req.body || {}) as any
    const privy = getPrivyClient()
    const policyId = process.env.PRIVY_WALLET_POLICY_ID
    const payload: any = {
      chainType: chainType || 'starknet',
      ...(policyId ? { policyIds: [policyId] } : {}),
      ...((ownerId || authUserId) ? { owner: { userId: ownerId || authUserId } } : {}),
    }
    const result = await privy.walletApi.createWallet(payload)
    return res.status(200).json({ wallet: result })
  } catch (error: any) {
    console.error('Error creating Privy wallet:', error)
    return res.status(500).json({ error: error.message || 'Failed to create Privy wallet' })
  }
})

router.post('/public-key', async (req: Request, res: Response) => {
  try {
    const { walletId } = (req.body || {}) as any
    if (!walletId) return res.status(400).json({ error: 'walletId is required' })
    const privy = getPrivyClient()
    const wallet = await privy.walletApi.getWallet({ id: walletId })
    return res.status(200).json({ public_key: (wallet as any).public_key || (wallet as any).publicKey, wallet })
  } catch (error: any) {
    console.error('Error fetching Privy wallet:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch Privy wallet' })
  }
})

router.post('/deploy-wallet', async (req: Request, res: Response) => {
  try {
    const { walletId } = (req.body || {}) as any
    if (!walletId) return res.status(400).json({ error: 'walletId is required' })
    const classHash = process.env.READY_CLASSHASH
    if (!classHash) return res.status(500).json({ error: 'READY_CLASSHASH not configured' })

    const privy = getPrivyClient()
    const wallet: any = await privy.walletApi.getWallet({ id: walletId })
    const chain = wallet?.chainType || wallet?.chain_type
    if (!wallet || !chain || chain !== 'starknet') {
      return res.status(400).json({ error: 'Provided wallet is not a Starknet wallet' })
    }
    const authUserId = (req as any).auth?.userId
    if (wallet.ownerId && authUserId && wallet.ownerId !== authUserId) {
      return res.status(403).json({ error: 'Wallet does not belong to authenticated user' })
    }
    const publicKey: string | undefined = wallet.public_key || wallet.publicKey
    if (!publicKey) return res.status(400).json({ error: 'Wallet missing Starknet public key' })
    const address = computeReadyAddress(publicKey)

    const deployResult: any = await deployReadyWithPrivySigner({ walletId, publicKey, classHash })
    return res.status(200).json({
      walletId,
      address,
      publicKey,
      transactionHash: deployResult?.transaction_hash,
    })
  } catch (error: any) {
    console.error('Error deploying Ready account:', error)
    return res.status(500).json({ error: error.message || 'Failed to deploy Ready account' })
  }
})

router.get('/user-wallets', async (req: Request, res: Response) => {
  try {
    const { userId } = (req.query || {}) as any
    if (!userId) return res.status(400).json({ error: 'userId is required' })
    const privy = getPrivyClient()
    const user: any = await privy.getUserById(userId)
    const accounts = user?.linkedAccounts || user?.linked_accounts || []
    const starkWallets = accounts.filter((acc: any) => acc?.type === 'wallet' && acc?.chain_type === 'starknet')
    const wallets = await Promise.all(
      starkWallets.map(async (acc: any) => {
        try {
          const w: any = await privy.walletApi.getWallet({ id: acc.id })
          const publicKey: string | undefined = w.public_key || w.publicKey
          const address = w.address || (publicKey ? computeReadyAddress(publicKey) : undefined)
          return { id: w.id, address, chainType: w.chain_type || w.chainType, publicKey }
        } catch {
          return { id: acc.id, address: acc.address, chainType: acc.chain_type || 'starknet' }
        }
      })
    )
    return res.status(200).json({ wallets })
  } catch (error: any) {
    console.error('Error fetching user wallets:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch user wallets' })
  }
})

export default router

