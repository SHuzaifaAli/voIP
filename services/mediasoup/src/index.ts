import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { logger } from './utils/logger'
import { MediaSoupManager } from './services/mediasoup-manager'
import { ConferenceManager } from './services/conference-manager'
import { RecordingManager } from './services/recording-manager'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
})

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
    service: 'callstack-mediasoup',
    components: {
      workers: 'connected',
      routers: 'active',
      database: 'connected'
    }
  })
})

// Initialize managers
const mediaSoupManager = new MediaSoupManager()
const conferenceManager = new ConferenceManager(mediaSoupManager, prisma)
const recordingManager = new RecordingManager()

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`MediaSoup client connected: ${socket.id}`)
  
  // Handle conference room joining
  socket.on('join-conference', async (data) => {
    try {
      const { conferenceId, userId, rtpCapabilities } = data
      
      logger.info(`User ${userId} joining conference: ${conferenceId}`)
      
      const result = await conferenceManager.joinConference({
        socketId: socket.id,
        conferenceId,
        userId,
        rtpCapabilities
      })
      
      socket.emit('conference-joined', result)
      
      // Notify other participants
      socket.to(conferenceId).emit('participant-joined', {
        userId,
        socketId: socket.id
      })
      
    } catch (error) {
      logger.error('Error joining conference:', error)
      socket.emit('conference-error', { message: 'Failed to join conference' })
    }
  })
  
  // Handle WebRTC transport creation
  socket.on('create-transport', async (data) => {
    try {
      const { direction, conferenceId } = data
      
      const transport = await conferenceManager.createTransport({
        socketId: socket.id,
        conferenceId,
        direction
      })
      
      socket.emit('transport-created', transport)
    } catch (error) {
      logger.error('Error creating transport:', error)
      socket.emit('transport-error', { message: 'Failed to create transport' })
    }
  })
  
  // Handle producer creation
  socket.on('create-producer', async (data) => {
    try {
      const { transportId, kind, rtpParameters, conferenceId } = data
      
      const producer = await conferenceManager.createProducer({
        socketId: socket.id,
        conferenceId,
        transportId,
        kind,
        rtpParameters
      })
      
      socket.emit('producer-created', producer)
      
      // Notify other participants
      socket.to(conferenceId).emit('new-producer', {
        producerId: producer.id,
        userId: socket.userId,
        kind
      })
      
    } catch (error) {
      logger.error('Error creating producer:', error)
      socket.emit('producer-error', { message: 'Failed to create producer' })
    }
  })
  
  // Handle consumer creation
  socket.on('create-consumer', async (data) => {
    try {
      const { producerId, rtpCapabilities, conferenceId } = data
      
      const consumer = await conferenceManager.createConsumer({
        socketId: socket.id,
        conferenceId,
        producerId,
        rtpCapabilities
      })
      
      socket.emit('consumer-created', consumer)
    } catch (error) {
      logger.error('Error creating consumer:', error)
      socket.emit('consumer-error', { message: 'Failed to create consumer' })
    }
  })
  
  // Handle recording start/stop
  socket.on('toggle-recording', async (data) => {
    try {
      const { conferenceId, record } = data
      
      if (record) {
        const recording = await recordingManager.startRecording({
          conferenceId,
          socketId: socket.id
        })
        
        socket.emit('recording-started', recording)
      } else {
        await recordingManager.stopRecording(conferenceId)
        socket.emit('recording-stopped', { conferenceId })
      }
      
    } catch (error) {
      logger.error('Error toggling recording:', error)
      socket.emit('recording-error', { message: 'Failed to toggle recording' })
    }
  })
  
  // Handle conference leaving
  socket.on('leave-conference', async (data) => {
    try {
      const { conferenceId } = data
      
      await conferenceManager.leaveConference({
        socketId: socket.id,
        conferenceId
      })
      
      // Notify other participants
      socket.to(conferenceId).emit('participant-left', {
        userId: socket.userId,
        socketId: socket.id
      })
      
    } catch (error) {
      logger.error('Error leaving conference:', error)
    }
  })
  
  socket.on('disconnect', () => {
    logger.info(`MediaSoup client disconnected: ${socket.id}`)
    
    // Clean up participant from all conferences
    conferenceManager.cleanupParticipant(socket.id)
  })
})

// Start server
const PORT = process.env.PORT || 3004

async function startServer() {
  try {
    // Initialize database connection
    await prisma.$connect()
    logger.info('Connected to database')
    
    // Initialize MediaSoup
    await mediaSoupManager.initialize()
    
    // Initialize recording manager
    await recordingManager.initialize()
    
    server.listen(PORT, () => {
      logger.info(`MediaSoup SFU running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  await mediaSoupManager.shutdown()
  await recordingManager.shutdown()
  await prisma.$disconnect()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  await mediaSoupManager.shutdown()
  await recordingManager.shutdown()
  await prisma.$disconnect()
  
  process.exit(0)
})

startServer().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})