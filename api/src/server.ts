import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { config as starknetConfig } from 'starknet'

// Load env in priority order: .env.local, .env, root fallbacks
const candidates = [
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
]
for (const p of candidates) {
  if (fs.existsSync(p)) dotenv.config({ path: p })
}

// Configure Starknet SDK to add overhead to resource bounds returned by estimations.
// This reduces the chance of out-of-gas during validate by padding l2 gas amounts.
// Adjust percentages as needed.
starknetConfig.set('resourceBoundsOverhead', {
  l1_gas: { max_amount: 50, max_price_per_unit: 50 },
  l1_data_gas: { max_amount: 50, max_price_per_unit: 50 },
  l2_gas: { max_amount: 300, max_price_per_unit: 50 },
})

const app = express()
const PORT = Number(process.env.PORT || 3000)

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true,
  })
)
app.use(express.json())

// Routes
app.use('/', require('./routes/health').default || require('./routes/health'))
const { authMiddleware } = require('./middleware/auth')
app.use('/privy', authMiddleware, require('./routes/privy').default || require('./routes/privy'))

app.listen(PORT, () => {
  console.log(`Ready Wallet Demo v2.0.0`)
  console.log(`Server running on http://localhost:${PORT}`)
})
