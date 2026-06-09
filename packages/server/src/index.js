import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { router } from './routes/index.js'
import { errorHandler } from './middleware/error.js'
import { env } from './config/env.js'
import { initDb } from './db/client.js'

const app = express()

// ─── Security ────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ─── Logging ─────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'))

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rate limiting ───────────────────────────────────────────
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  })
)

// ─── Routes ──────────────────────────────────────────────────
app.use('/api', router)

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'bizpilot-server', timestamp: new Date().toISOString() })
)

// ─── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// ─── Error handler ───────────────────────────────────────────
app.use(errorHandler)

// ─── Start ───────────────────────────────────────────────────
const start = async () => {
  try {
    await initDb()
    app.listen(env.PORT, () => {
      console.log('')
      console.log('  ╔══════════════════════════════════╗')
      console.log('  ║   🚀 BizPilot Server Running     ║')
      console.log(`  ║   Port: ${env.PORT}                      ║`)
      console.log(`  ║   Env:  ${env.NODE_ENV.padEnd(24)}║`)
      console.log('  ╚══════════════════════════════════╝')
      console.log('')
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
