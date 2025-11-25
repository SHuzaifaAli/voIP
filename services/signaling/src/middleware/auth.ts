import jwt from 'jsonwebtoken'
import { Socket } from 'socket.io'
import { logger } from '../utils/logger'

interface DecodedToken {
  userId: string
  email: string
  iat: number
  exp: number
}

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return next(new Error('Authentication token required'))
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken
    
    // Attach user data to socket
    socket.data.userId = decoded.userId
    socket.data.email = decoded.email
    
    logger.info(`User authenticated: ${decoded.userId}`)
    next()
  } catch (error) {
    logger.error('Authentication failed:', error)
    next(new Error('Invalid authentication token'))
  }
}