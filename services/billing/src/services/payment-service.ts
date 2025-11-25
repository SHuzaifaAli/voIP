import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import Stripe from 'stripe'

export class PaymentService {
  private prisma: PrismaClient
  private stripe: Stripe

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    })
  }

  async createPaymentIntent(invoiceId: string): Promise<any> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { user: true }
      })

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`)
      }

      if (invoice.status !== 'PENDING') {
        throw new Error(`Invoice ${invoiceId} is not pending`)
      }

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(invoice.amount * 100), // Convert to cents
        currency: invoice.currency.toLowerCase(),
        metadata: {
          invoiceId: invoice.id,
          userId: invoice.userId
        },
        automatic_payment_methods: {
          enabled: true
        }
      })

      // Update invoice with payment intent ID
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          stripePaymentIntentId: paymentIntent.id
        }
      })

      logger.info(`Created payment intent ${paymentIntent.id} for invoice ${invoiceId}`)
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    } catch (error) {
      logger.error(`Error creating payment intent for invoice ${invoiceId}:`, error)
      throw error
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
          break
        case 'payment_intent.canceled':
          await this.handlePaymentCancellation(event.data.object as Stripe.PaymentIntent)
          break
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`)
      }
    } catch (error) {
      logger.error(`Error handling webhook event ${event.type}:`, error)
      throw error
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoiceId
    
    if (!invoiceId) {
      logger.warn('Payment intent missing invoice ID in metadata')
      return
    }

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    })

    // Reset user's billing balance
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (invoice) {
      await this.prisma.user.update({
        where: { id: invoice.userId },
        data: {
          billingBalance: {
            decrement: invoice.amount
          }
        }
      })
    }

    logger.info(`Payment succeeded for invoice ${invoiceId}`)
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoiceId
    
    if (!invoiceId) {
      logger.warn('Payment intent missing invoice ID in metadata')
      return
    }

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
      }
    })

    logger.info(`Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message}`)
  }

  private async handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoiceId
    
    if (!invoiceId) {
      logger.warn('Payment intent missing invoice ID in metadata')
      return
    }

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED'
      }
    })

    logger.info(`Payment cancelled for invoice ${invoiceId}`)
  }

  async refundPayment(invoiceId: string, amount?: number): Promise<any> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId }
      })

      if (!invoice || !invoice.stripePaymentIntentId) {
        throw new Error(`Invoice or payment intent not found: ${invoiceId}`)
      }

      // Create refund
      const refund = await this.stripe.refunds.create({
        payment_intent: invoice.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined // Convert to cents
      })

      // Update invoice status
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: amount || invoice.amount
        }
      })

      // Update user's billing balance
      await this.prisma.user.update({
        where: { id: invoice.userId },
        data: {
          billingBalance: {
            decrement: amount || invoice.amount
          }
        }
      })

      logger.info(`Refund processed for invoice ${invoiceId}`)
      return refund
    } catch (error) {
      logger.error(`Error processing refund for invoice ${invoiceId}:`, error)
      throw error
    }
  }

  async getPaymentMethods(userId: string): Promise<any[]> {
    // In a real implementation, this would retrieve saved payment methods
    // For now, return empty array
    return []
  }

  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // In a real implementation, this would save the payment method to the user's account
    logger.info(`Payment method ${paymentMethodId} added for user ${userId}`)
  }

  async getPaymentHistory(userId: string, limit: number = 50): Promise<any[]> {
    return await this.prisma.invoice.findMany({
      where: { 
        userId,
        status: { in: ['PAID', 'REFUNDED'] }
      },
      orderBy: { paidAt: 'desc' },
      take: limit
    })
  }
}