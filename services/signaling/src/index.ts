import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createClient } from 'redis'
import { logger } from './utils/logger'
import { authenticateSocket } from './middleware/auth'
import { handleSocketEvents } from './handlers/socket'

dotenv.config()

const app = express()
const server = createServer(app)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'callstack-signaling'
  })
})

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Redis client for session management
let redisClient: ReturnType<typeof createClient>

async function initializeRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err)
    })
    
    await redisClient.connect()
    logger.info('Connected to Redis')
  } catch (error) {
    logger.error('Failed to connect to Redis:', error)
    process.exit(1)
  }
}

// Socket authentication middleware
io.use(authenticateSocket)

// Socket connection handler
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.data.userId}`)
  
  // Store user session in Redis
  redisClient.setEx(
    `user:${socket.data.userId}:socket`, 
    3600, // 1 hour TTL
    socket.id
  )
  
  // Handle socket events
  handleSocketEvents(socket, redisClient)
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.data.userId}`)
    
    // Clean up Redis session
    redisClient.del(`user:${socket.data.userId}:socket`)
  })
})

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await initializeRedis()
    
    server.listen(PORT, () => {
      logger.info(`Signaling server running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  if (redisClient) {
    await redisClient.quit()
  }
  
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  if (redisClient) {
    await redisClient.quit()
  }
  
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

startServer().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})