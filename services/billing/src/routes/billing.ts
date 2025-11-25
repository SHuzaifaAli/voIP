import { Router } from 'express'
import { BillingService } from '../services/billing-service'
import { InvoiceService } from '../services/invoice-service'
import { PaymentService } from '../services/payment-service'
import { createError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

export function billingRoutes(
  billingService: BillingService,
  invoiceService: InvoiceService,
  paymentService: PaymentService
): Router {
  const router = Router()

  // Get user billing summary
  router.get('/summary/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params
      const { startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const end = endDate ? new Date(endDate as string) : new Date()

      const summary = await billingService.getUserBillingSummary(userId, start, end)
      
      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      next(error)
    }
  })

  // Get user invoices
  router.get('/invoices/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params
      const { limit = 50 } = req.query

      const invoices = await invoiceService.getUserInvoices(userId, parseInt(limit as string))
      
      res.json({
        success: true,
        data: { invoices }
      })
    } catch (error) {
      next(error)
    }
  })

  // Get specific invoice
  router.get('/invoices/:invoiceId', async (req, res, next) => {
    try {
      const { invoiceId } = req.params

      const invoice = await invoiceService.getInvoice(invoiceId)
      
      if (!invoice) {
        throw createError('Invoice not found', 404)
      }

      res.json({
        success: true,
        data: { invoice }
      })
    } catch (error) {
      next(error)
    }
  })

  // Create payment intent
  router.post('/payment-intent', async (req, res, next) => {
    try {
      const { invoiceId } = req.body

      if (!invoiceId) {
        throw createError('Invoice ID is required', 400)
      }

      const paymentIntent = await paymentService.createPaymentIntent(invoiceId)
      
      res.json({
        success: true,
        data: paymentIntent
      })
    } catch (error) {
      next(error)
    }
  })

  // Stripe webhook handler
  router.post('/webhook/stripe', async (req, res, next) => {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const sig = req.headers['stripe-signature'] as string

      let event

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        logger.error('Webhook signature verification failed:', err)
        return res.status(400).send('Webhook signature verification failed')
      }

      await paymentService.handleWebhook(event)
      
      res.json({ received: true })
    } catch (error) {
      next(error)
    }
  })

  // Get billing rates
  router.get('/rates', async (req, res, next) => {
    try {
      const rates = await billingService.getBillingRates()
      
      res.json({
        success: true,
        data: rates
      })
    } catch (error) {
      next(error)
    }
  })

  // Update billing settings
  router.put('/settings/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params
      const settings = req.body

      await billingService.updateUserBillingSettings(userId, settings)
      
      res.json({
        success: true,
        message: 'Billing settings updated successfully'
      })
    } catch (error) {
      next(error)
    }
  })

  // Get payment history
  router.get('/payments/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params
      const { limit = 50 } = req.query

      const payments = await paymentService.getPaymentHistory(userId, parseInt(limit as string))
      
      res.json({
        success: true,
        data: { payments }
      })
    } catch (error) {
      next(error)
    }
  })

  // Process refund
  router.post('/refund', async (req, res, next) => {
    try {
      const { invoiceId, amount } = req.body

      if (!invoiceId) {
        throw createError('Invoice ID is required', 400)
      }

      const refund = await paymentService.refundPayment(invoiceId, amount)
      
      res.json({
        success: true,
        data: { refund }
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}