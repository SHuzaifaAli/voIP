import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { logger } from './utils/logger'
import { authRoutes } from './routes/auth'
import { sipRoutes } from './routes/sip'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const prisma = new PrismaClient()

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json())
app.use(limiter)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'callstack-sip-auth',
    database: 'connected'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/sip', sipRoutes)

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3002

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    logger.info('Connected to database')

    app.listen(PORT, () => {
      logger.info(`SIP Auth service running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

startServer().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})