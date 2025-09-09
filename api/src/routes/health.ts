import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'Ready Wallet API running',
    version: '2.0.0',
    endpoints: {
      privyCreate: 'POST /privy/create-wallet',
      privyDeploy: 'POST /privy/deploy-wallet',
      paymasterCreate: 'POST /create-wallet',
    },
  })
})

export default router

