import { Socket } from 'socket.io'
import { RedisClientType } from 'redis'
import { logger } from '../utils/logger'

interface CallSignal {
  target: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

export const handleSocketEvents = (socket: Socket, redisClient: RedisClientType) => {
  // Handle making a call
  socket.on('call', async (data: CallSignal) => {
    try {
      const { target, offer } = data
      
      // Get target user's socket ID from Redis
      const targetSocketId = await redisClient.get(`user:${target}:socket`)
      
      if (!targetSocketId) {
        socket.emit('call-error', { message: 'User not available' })
        return
      }
      
      // Forward the offer to the target user
      socket.to(targetSocketId).emit('offer', {
        offer,
        from: socket.data.userId
      })
      
      logger.info(`Call initiated from ${socket.data.userId} to ${target}`)
    } catch (error) {
      logger.error('Error handling call:', error)
      socket.emit('call-error', { message: 'Failed to initiate call' })
    }
  })
  
  // Handle call answer
  socket.on('answer', async (data: CallSignal) => {
    try {
      const { answer, to } = data
      
      // Get target user's socket ID from Redis
      const targetSocketId = await redisClient.get(`user:${to}:socket`)
      
      if (!targetSocketId) {
        socket.emit('call-error', { message: 'User not available' })
        return
      }
      
      // Forward the answer to the caller
      socket.to(targetSocketId).emit('answer', {
        answer,
        from: socket.data.userId
      })
      
      logger.info(`Call answered by ${socket.data.userId} for ${to}`)
    } catch (error) {
      logger.error('Error handling answer:', error)
      socket.emit('call-error', { message: 'Failed to answer call' })
    }
  })
  
  // Handle ICE candidates
  socket.on('ice-candidate', async (data: CallSignal) => {
    try {
      const { candidate, to } = data
      
      // Get target user's socket ID from Redis
      const targetSocketId = await redisClient.get(`user:${to}:socket`)
      
      if (!targetSocketId) {
        return // Silently fail for ICE candidates
      }
      
      // Forward the ICE candidate to the target user
      socket.to(targetSocketId).emit('ice-candidate', {
        candidate,
        from: socket.data.userId
      })
    } catch (error) {
      logger.error('Error handling ICE candidate:', error)
      // Silently fail for ICE candidates
    }
  })
  
  // Handle end call
  socket.on('end-call', async (data: { to: string }) => {
    try {
      const { to } = data
      
      // Get target user's socket ID from Redis
      const targetSocketId = await redisClient.get(`user:${to}:socket`)
      
      if (!targetSocketId) {
        return
      }
      
      // Notify the other user
      socket.to(targetSocketId).emit('call-ended', {
        from: socket.data.userId
      })
      
      logger.info(`Call ended between ${socket.data.userId} and ${to}`)
    } catch (error) {
      logger.error('Error handling end call:', error)
    }
  })
  
  // Handle user status updates
  socket.on('status-update', async (data: { status: 'online' | 'away' | 'busy' }) => {
    try {
      const { status } = data
      
      // Update user status in Redis
      await redisClient.setEx(
        `user:${socket.data.userId}:status`,
        3600, // 1 hour TTL
        status
      )
      
      // Broadcast status to connected users (in a real app, you'd have a roster/friends list)
      socket.broadcast.emit('user-status-changed', {
        userId: socket.data.userId,
        status
      })
      
      logger.info(`User ${socket.data.userId} status updated to ${status}`)
    } catch (error) {
      logger.error('Error handling status update:', error)
    }
  })
  
  // Handle getting user status
  socket.on('get-user-status', async (data: { userId: string }, callback) => {
    try {
      const { userId } = data
      
      // Get user status from Redis
      const status = await redisClient.get(`user:${userId}:status`)
      
      callback({
        userId,
        status: status || 'offline'
      })
    } catch (error) {
      logger.error('Error getting user status:', error)
      callback({
        userId: data.userId,
        status: 'offline'
      })
    }
  })
}