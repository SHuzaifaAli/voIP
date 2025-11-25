import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

export class PaymentProcessor {
  private stripe: Stripe
  private prisma: PrismaClient

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    })
    this.prisma = new PrismaClient()
  }

  async initialize(): Promise<void> {
    try {
      // Test Stripe connection
      await this.stripe.accounts.retrieve()
      logger.info('Stripe initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Stripe:', error)
      throw error
    }
  }

  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      })

      // Update user with Stripe customer ID
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      })

      logger.info(`Created Stripe customer for user ${userId}: ${customer.id}`)
      return customer
    } catch (error) {
      logger.error(`Error creating Stripe customer for user ${userId}:`, error)
      throw error
    }
  }

  async createPaymentIntent(invoiceId: string): Promise<Stripe.PaymentIntent> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          user: true
        }
      })

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`)
      }

      let customerId = invoice.user.stripeCustomerId

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(
          invoice.user.id,
          invoice.user.email || '',
          invoice.user.name || undefined
        )
        customerId = customer.id
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(invoice.totalCost * 100), // Convert to cents
        currency: invoice.currency.toLowerCase(),
        customer: customerId,
        metadata: {
          invoiceId
        },
        description: `CallStack Invoice ${invoiceId}`,
        automatic_payment_methods: {
          enabled: true
        }
      })

      // Update invoice with payment intent ID
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
          stripePaymentIntentId: paymentIntent.id,
          status: 'PROCESSING'
        }
      })

      logger.info(`Created payment intent for invoice ${invoiceId}: ${paymentIntent.id}`)
      return paymentIntent
    } catch (error) {
      logger.error(`Error creating payment intent for invoice ${invoiceId}:`, error)
      throw error
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId)

      if (paymentIntent.status === 'succeeded') {
        await this.handlePaymentSuccess({
          id: paymentIntent.id,
          metadata: paymentIntent.metadata,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        })
      }

      return paymentIntent
    } catch (error) {
      logger.error(`Error confirming payment ${paymentIntentId}:`, error)
      throw error
    }
  }

  async handlePaymentSuccess(paymentData: any): Promise<void> {
    try {
      const { metadata } = paymentData
      const invoiceId = metadata?.invoiceId

      if (!invoiceId) {
        logger.warn('Payment success webhook missing invoice ID')
        return
      }

      // Update invoice status
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          updatedAt: new Date()
        }
      })

      logger.info(`Payment processed successfully for invoice ${invoiceId}`)
    } catch (error) {
      logger.error('Error handling payment success:', error)
      throw error
    }
  }

  async handlePaymentFailure(paymentData: any): Promise<void> {
    try {
      const { metadata } = paymentData
      const invoiceId = metadata?.invoiceId

      if (!invoiceId) {
        logger.warn('Payment failure webhook missing invoice ID')
        return
      }

      // Update invoice status
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'FAILED',
          updatedAt: new Date()
        }
      })

      logger.info(`Payment failed for invoice ${invoiceId}`)
    } catch (error) {
      logger.error('Error handling payment failure:', error)
      throw error
    }
  }

  async handleSubscriptionCreated(subscriptionData: any): Promise<void> {
    try {
      const { customer, metadata } = subscriptionData
      const userId = metadata?.userId

      if (!userId) {
        logger.warn('Subscription created webhook missing user ID')
        return
      }

      // Update user with subscription info
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: subscriptionData.id,
          stripeCustomerId: customer,
          updatedAt: new Date()
        }
      })

      logger.info(`Subscription created for user ${userId}: ${subscriptionData.id}`)
    } catch (error) {
      logger.error('Error handling subscription created:', error)
      throw error
    }
  }

  async handleSubscriptionDeleted(subscriptionData: any): Promise<void> {
    try {
      const { metadata } = subscriptionData
      const userId = metadata?.userId

      if (!userId) {
        logger.warn('Subscription deleted webhook missing user ID')
        return
      }

      // Update user subscription status
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: null,
          updatedAt: new Date()
        }
      })

      logger.info(`Subscription deleted for user ${userId}`)
    } catch (error) {
      logger.error('Error handling subscription deleted:', error)
      throw error
    }
  }

  async createRefund(invoiceId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId }
      })

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`)
      }

      if (!invoice.stripePaymentIntentId) {
        throw new Error(`No payment intent found for invoice: ${invoiceId}`)
      }

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
          updatedAt: new Date()
        }
      })

      logger.info(`Refund created for invoice ${invoiceId}: ${refund.id}`)
      return refund
    } catch (error) {
      logger.error(`Error creating refund for invoice ${invoiceId}:`, error)
      throw error
    }
  }

  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      })

      return paymentMethods.data
    } catch (error) {
      logger.error(`Error getting payment methods for customer ${customerId}:`, error)
      throw error
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      })

      logger.info(`Payment method attached to customer ${customerId}: ${paymentMethodId}`)
      return paymentMethod
    } catch (error) {
      logger.error(`Error attaching payment method ${paymentMethodId}:`, error)
      throw error
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId)
      logger.info(`Payment method detached: ${paymentMethodId}`)
      return paymentMethod
    } catch (error) {
      logger.error(`Error detaching payment method ${paymentMethodId}:`, error)
      throw error
    }
  }
}