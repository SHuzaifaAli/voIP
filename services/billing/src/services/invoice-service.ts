import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import PDFDocument from 'pdfkit'
import * as nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'

export interface InvoiceData {
  userId: string
  period: string
  amount: number
  calls: number
  minutes: number
  dueDate: Date
}

export class InvoiceService {
  private prisma: PrismaClient
  private emailTransporter: nodemailer.Transporter

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    })
  }

  async generateMonthlyInvoice(userId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      // Get user's billing data for the period
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

      if (totalCost <= 0) {
        logger.info(`No billing activity for user ${userId} in period ${startDate.toISOString()} - ${endDate.toISOString()}`)
        return null
      }

      // Create invoice record
      const invoice = await this.prisma.invoice.create({
        data: {
          id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          period: startDate.toISOString().substring(0, 7), // YYYY-MM
          amount: totalCost,
          status: 'PENDING',
          dueDate: new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days after period end
          calls: totalCalls,
          minutes: Math.floor(totalMinutes),
          currency: 'USD'
        }
      })

      // Generate PDF invoice
      const pdfBuffer = await this.generateInvoicePDF(invoice, calls)

      // Send email notification
      await this.sendInvoiceEmail(invoice, pdfBuffer)

      logger.info(`Generated monthly invoice ${invoice.id} for user ${userId}`)
      return invoice
    } catch (error) {
      logger.error(`Error generating monthly invoice for user ${userId}:`, error)
      throw error
    }
  }

  async generateInvoicePDF(invoice: any, calls: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument()
        const chunks: Buffer[] = []

        doc.on('data', (chunk) => {
          chunks.push(chunk)
        })

        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks)
          resolve(pdfBuffer)
        })

        doc.on('error', reject)

        // Invoice content
        doc.fontSize(20).text('CallStack Invoice', 50, 50)
        doc.fontSize(12).text(`Invoice #: ${invoice.id}`, 50, 80)
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 100)
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 120)
        
        // Billing details
        doc.fontSize(14).text('Billing Details', 50, 160)
        doc.fontSize(12).text(`Period: ${invoice.period}`, 50, 180)
        doc.text(`Total Calls: ${invoice.calls}`, 50, 200)
        doc.text(`Total Minutes: ${invoice.minutes}`, 50, 220)
        doc.text(`Amount Due: $${invoice.amount.toFixed(2)}`, 50, 240)
        
        // Call details table
        doc.fontSize(14).text('Call Details', 50, 280)
        
        let yPosition = 310
        doc.fontSize(10)
        
        calls.slice(0, 20).forEach((call, index) => {
          if (yPosition > 700) {
            doc.addPage()
            yPosition = 50
          }
          
          doc.text(`${index + 1}. ${new Date(call.startTime).toLocaleDateString()}`, 50, yPosition)
          doc.text(`${call.callerNumber} → ${call.calleeNumber}`, 200, yPosition)
          doc.text(`${Math.floor(call.duration / 60)}m ${call.duration % 60}s`, 350, yPosition)
          doc.text(`$${(call.cost || 0).toFixed(2)}`, 450, yPosition)
          
          yPosition += 20
        })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  async sendInvoiceEmail(invoice: any, pdfBuffer: Buffer): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: invoice.userId }
      })

      if (!user) {
        throw new Error(`User not found: ${invoice.userId}`)
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'billing@callstack.com',
        to: user.email,
        subject: `CallStack Invoice ${invoice.id}`,
        html: this.getInvoiceEmailTemplate(invoice, user),
        attachments: [
          {
            filename: `invoice-${invoice.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      }

      await this.emailTransporter.sendMail(mailOptions)
      logger.info(`Invoice email sent for ${invoice.id} to ${user.email}`)
    } catch (error) {
      logger.error(`Error sending invoice email for ${invoice.id}:`, error)
      throw error
    }
  }

  async sendPaymentReminder(invoice: any): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: invoice.userId }
      })

      if (!user) {
        throw new Error(`User not found: ${invoice.userId}`)
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'billing@callstack.com',
        to: user.email,
        subject: `Payment Reminder: Invoice ${invoice.id}`,
        html: this.getPaymentReminderTemplate(invoice, user)
      }

      await this.emailTransporter.sendMail(mailOptions)
      logger.info(`Payment reminder sent for ${invoice.id} to ${user.email}`)
    } catch (error) {
      logger.error(`Error sending payment reminder for ${invoice.id}:`, error)
    }
  }

  private getInvoiceEmailTemplate(invoice: any, user: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CallStack Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .invoice-details { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .total { font-size: 24px; font-weight: bold; color: #007bff; }
          .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CallStack Invoice</h1>
            <p>Hello ${user.name || user.email},</p>
            <p>Your invoice for ${invoice.period} is now available.</p>
          </div>
          
          <div class="invoice-details">
            <h2>Invoice Details</h2>
            <p><strong>Invoice #:</strong> ${invoice.id}</p>
            <p><strong>Period:</strong> ${invoice.period}</p>
            <p><strong>Total Calls:</strong> ${invoice.calls}</p>
            <p><strong>Total Minutes:</strong> ${invoice.minutes}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p class="total">Amount Due: $${invoice.amount.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for using CallStack!</p>
            <p>If you have any questions, please contact our support team.</p>
            <p><a href="https://callstack.com/billing">View and pay your invoice online</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getPaymentReminderTemplate(invoice: any, user: any): string {
    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder: Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .invoice-details { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .total { font-size: 24px; font-weight: bold; color: #dc3545; }
          .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>Payment Reminder</h2>
            <p>Your invoice is ${daysOverdue} days overdue.</p>
          </div>
          
          <div class="invoice-details">
            <h2>Invoice Details</h2>
            <p><strong>Invoice #:</strong> ${invoice.id}</p>
            <p><strong>Period:</strong> ${invoice.period}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p class="total">Amount Due: $${invoice.amount.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Please make your payment as soon as possible to avoid service interruption.</p>
            <p><a href="https://callstack.com/billing">Pay your invoice online</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async getInvoice(invoiceId: string): Promise<any> {
    return await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true
      }
    })
  }

  async getUserInvoices(userId: string, limit: number = 50): Promise<any[]> {
    return await this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status }
    })
  }
}