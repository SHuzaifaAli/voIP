import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { createError } from '../middleware/errorHandler'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = Router()
const prisma = new PrismaClient()

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role = 'USER' } = req.body

    if (!email || !password) {
      throw createError('Email and password are required', 400)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw createError('User already exists', 409)
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role.toUpperCase()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Generate SIP credentials
    const sipUsername = `sip_${user.id.substring(0, 8)}`
    const sipPassword = generateSipPassword()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sipUsername,
        sipPassword: await bcrypt.hash(sipPassword, saltRounds)
      }
    })

    logger.info(`User registered: ${email}`)

    res.status(201).json({
      success: true,
      data: {
        user,
        sipCredentials: {
          username: sipUsername,
          password: sipPassword
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw createError('Email and password are required', 400)
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.isActive) {
      throw createError('Invalid credentials', 401)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401)
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    logger.info(`User logged in: ${email}`)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get current user info
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sipUsername: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    res.json({
      success: true,
      data: { user }
    })
  } catch (error) {
    next(error)
  }
})

// Update password
router.put('/password', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw createError('Current and new passwords are required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      throw createError('Current password is incorrect', 401)
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedNewPassword }
    })

    logger.info(`Password updated for user: ${req.user!.email}`)

    res.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Helper function to generate SIP password
function generateSipPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export { router as authRoutes }