import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import * as cron from 'node-cron'
import { InvoiceService } from './invoice-service'
import { PaymentService } from './payment-service'

export interface BillingRates {
  perMinuteRate: number
  connectionFee: number
  videoSurcharge: number
  internationalSurcharge: number
}

export class BillingService {
  private prisma: PrismaClient
  private invoiceService: InvoiceService
  private paymentService: PaymentService
  private billingRates: BillingRates
  private cronJobs: cron.ScheduledTask[] = []

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.invoiceService = new InvoiceService(prisma)
    this.paymentService = new PaymentService(prisma)
    
    this.billingRates = {
      perMinuteRate: parseFloat(process.env.PER_MINUTE_RATE || '0.02'),
      connectionFee: parseFloat(process.env.CONNECTION_FEE || '0.01'),
      videoSurcharge: parseFloat(process.env.VIDEO_SURCHARGE || '0.005'),
      internationalSurcharge: parseFloat(process.env.INTERNATIONAL_SURCHARGE || '0.01')
    }
  }

  async startScheduler(): Promise<void> {
    logger.info('Starting billing scheduler')

    // Daily billing process at 2 AM
    const dailyJob = cron.schedule('0 2 * * *', async () => {
      await this.processDailyBilling()
    }, {
      scheduled: true,
      timezone: 'UTC'
    })

    // Monthly invoice generation on 1st of each month
    const monthlyJob = cron.schedule('0 3 1 * *', async () => {
      await this.generateMonthlyInvoices()
    }, {
      scheduled: true,
      timezone: 'UTC'
    })

    // Payment reminders every 3 days
    const reminderJob = cron.schedule('0 9 */3 * *', async () => {
      await this.sendPaymentReminders()
    }, {
      scheduled: true,
      timezone: 'UTC'
    })

    this.cronJobs.push(dailyJob, monthlyJob, reminderJob)
    
    logger.info('Billing scheduler started with 3 jobs')
  }

  async stopScheduler(): Promise<void> {
    logger.info('Stopping billing scheduler')
    
    this.cronJobs.forEach(job => {
      job.stop()
    })
    
    this.cronJobs = []
    logger.info('Billing scheduler stopped')
  }

  async processDailyBilling(): Promise<void> {
    try {
      logger.info('Starting daily billing process')
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(23, 59, 59, 999)
      
      const startOfDay = new Date(yesterday)
      startOfDay.setHours(0, 0, 0, 0)
      
      // Get all completed calls from yesterday
      const calls = await this.prisma.callDetailRecord.findMany({
        where: {
          startTime: {
            gte: startOfDay,
            lte: yesterday
          },
          endTime: {
            not: null
          }
        },
        include: {
          user: true
        }
      })

      logger.info(`Processing ${calls.length} calls for billing`)

      for (const call of calls) {
        await this.processCallBilling(call)
      }

      logger.info('Daily billing process completed')
    } catch (error) {
      logger.error('Error in daily billing process:', error)
    }
  }

  async processCallBilling(cdr: any): Promise<void> {
    try {
      const cost = this.calculateCallCost(cdr)
      
      // Update CDR with cost
      await this.prisma.callDetailRecord.update({
        where: { id: cdr.id },
        data: { cost }
      })

      // Update user's billing balance
      await this.prisma.user.update({
        where: { id: cdr.userId },
        data: {
          billingBalance: {
            increment: cost
          }
        }
      })

      logger.info(`Processed billing for call ${cdr.callId}: $${cost.toFixed(2)}`)
    } catch (error) {
      logger.error(`Error processing billing for call ${cdr.callId}:`, error)
    }
  }

  calculateCallCost(cdr: any): number {
    const durationMinutes = cdr.duration / 60
    let cost = this.billingRates.connectionFee

    // Per-minute charge
    cost += durationMinutes * this.billingRates.perMinuteRate

    // Video surcharge
    if (cdr.callType === 'VIDEO') {
      cost += durationMinutes * this.billingRates.videoSurcharge
    }

    // International surcharge (simplified - would use actual number detection)
    if (this.isInternationalCall(cdr.calleeNumber)) {
      cost += durationMinutes * this.billingRates.internationalSurcharge
    }

    return Math.round(cost * 100) / 100 // Round to 2 decimal places
  }

  isInternationalCall(phoneNumber: string): boolean {
    // Simplified international number detection
    // In production, would use proper country code detection
    return phoneNumber.startsWith('+') && !phoneNumber.startsWith('+1')
  }

  async generateMonthlyInvoices(): Promise<void> {
    try {
      logger.info('Starting monthly invoice generation')
      
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const firstDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
      const lastDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
      
      // Get all users with billing activity
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { billingBalance: { gt: 0 } },
            { 
              callDetailRecords: {
                some: {
                  startTime: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                  }
                }
              }
            }
          ]
        }
      })

      logger.info(`Generating invoices for ${users.length} users`)

      for (const user of users) {
        await this.invoiceService.generateMonthlyInvoice(user.id, firstDayOfMonth, lastDayOfMonth)
      }

      logger.info('Monthly invoice generation completed')
    } catch (error) {
      logger.error('Error in monthly invoice generation:', error)
    }
  }

  async sendPaymentReminders(): Promise<void> {
    try {
      logger.info('Sending payment reminders')
      
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          user: true
        }
      })

      for (const invoice of overdueInvoices) {
        await this.invoiceService.sendPaymentReminder(invoice)
      }

      logger.info(`Sent ${overdueInvoices.length} payment reminders`)
    } catch (error) {
      logger.error('Error sending payment reminders:', error)
    }
  }

  async getUserBillingSummary(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const calls = await this.prisma.callDetailRecord.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0)
    const totalMinutes = calls.reduce((sum, call) => sum + call.duration, 0) / 60
    const totalCalls = calls.length

    return {
      totalCost,
      totalMinutes,
      totalCalls,
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      averageCostPerMinute: totalMinutes > 0 ? totalCost / totalMinutes : 0
    }
  }

  async updateUserBillingSettings(userId: string, settings: any): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        billingSettings: settings
      }
    })
  }

  async getBillingRates(): Promise<BillingRates> {
    return this.billingRates
  }

  async updateBillingRates(newRates: Partial<BillingRates>): Promise<void> {
    Object.assign(this.billingRates, newRates)
    logger.info('Billing rates updated:', this.billingRates)
  }
}