import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { logger } from './utils/logger'
import { BillingService } from './services/billing-service'
import { InvoiceService } from './services/invoice-service'
import { PaymentService } from './services/payment-service'
import { billingRoutes } from './routes/billing'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'callstack-billing',
    components: {
      billing: 'active',
      invoicing: 'active',
      payments: 'active'
    }
  })
})

// Initialize services
const billingService = new BillingService(prisma)
const invoiceService = new InvoiceService(prisma)
const paymentService = new PaymentService(prisma)

// Routes
app.use('/api/billing', billingRoutes(billingService, invoiceService, paymentService))

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3005

async function startServer() {
  try {
    // Initialize database connection
    await prisma.$connect()
    logger.info('Connected to database')

    // Start billing scheduler
    await billingService.startScheduler()

    server.listen(PORT, () => {
      logger.info(`Billing service running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  await billingService.stopScheduler()
  await prisma.$disconnect()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  await billingService.stopScheduler()
  await prisma.$disconnect()
  
  process.exit(0)
})

startServer().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})