// Report Scheduling and Delivery Service

import { prisma } from '@/lib/prisma'
import { reportService } from './report-service'
import { sendEmail } from '@/lib/email'
import type { ReportSchedule, ReportFormat, ReportFrequency } from '@/types/reports'
import parser from 'cron-parser'

export class ReportScheduler {
  /**
   * Create a scheduled report
   */
  async createSchedule(data: {
    name: string
    description?: string
    templateId: string
    frequency: ReportFrequency
    cronExpression?: string
    timezone?: string
    format: ReportFormat
    recipients: string[]
    emailSubject?: string
    emailBody?: string
    config: any
    createdBy?: string
  }) {
    // Calculate next run time
    const nextRunAt = this.calculateNextRun(
      data.frequency,
      data.cronExpression,
      data.timezone || 'UTC'
    )

    const schedule = await prisma.reportSchedule.create({
      data: {
        name: data.name,
        description: data.description,
        templateId: data.templateId,
        frequency: data.frequency,
        cronExpression: data.cronExpression,
        timezone: data.timezone || 'UTC',
        format: data.format,
        recipients: data.recipients,
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        config: data.config,
        isActive: true,
        nextRunAt,
        createdBy: data.createdBy
      },
      include: {
        template: true
      }
    })

    return schedule
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    data: Partial<{
      name: string
      description: string
      frequency: ReportFrequency
      cronExpression: string
      timezone: string
      format: ReportFormat
      recipients: string[]
      emailSubject: string
      emailBody: string
      config: any
      isActive: boolean
    }>
  ) {
    const updateData: any = { ...data }

    // Recalculate next run if frequency or cron changed
    if (data.frequency || data.cronExpression) {
      const schedule = await prisma.reportSchedule.findUnique({
        where: { id: scheduleId }
      })
      
      if (schedule) {
        updateData.nextRunAt = this.calculateNextRun(
          data.frequency || schedule.frequency,
          data.cronExpression || schedule.cronExpression,
          data.timezone || schedule.timezone
        )
      }
    }

    return await prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: { template: true }
    })
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string) {
    return await prisma.reportSchedule.delete({
      where: { id: scheduleId }
    })
  }

  /**
   * Execute a scheduled report
   */
  async executeSchedule(scheduleId: string) {
    const schedule = await prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
      include: { template: true }
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    if (!schedule.isActive) {
      throw new Error('Schedule is inactive')
    }

    try {
      // Generate the report
      const report = await reportService.generateReport(
        `${schedule.name} - ${new Date().toLocaleDateString()}`,
        schedule.template.type,
        schedule.config as any,
        schedule.createdBy || undefined
      )

      // Export to requested format
      const exportResult = await reportService.exportReport(
        report.id,
        schedule.format,
        {
          format: schedule.format,
          includeSummary: true,
          includeCharts: true,
          includeRawData: true
        }
      )

      // Send email to recipients
      await this.sendReportEmail(schedule, exportResult)

      // Update schedule
      await prisma.reportSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun(
            schedule.frequency,
            schedule.cronExpression,
            schedule.timezone
          ),
          lastStatus: 'Success',
          failureCount: 0
        }
      })

      // Link report to schedule
      await prisma.report.update({
        where: { id: report.id },
        data: { scheduleId }
      })

      return { success: true, reportId: report.id }
    } catch (error) {
      // Update failure count
      await prisma.reportSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          lastStatus: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          failureCount: { increment: 1 }
        }
      })

      throw error
    }
  }

  /**
   * Send report via email
   */
  private async sendReportEmail(
    schedule: any,
    exportResult: { buffer: Buffer; fileName: string; mimeType: string }
  ) {
    const subject = schedule.emailSubject || `Scheduled Report: ${schedule.name}`
    const body = schedule.emailBody || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Your Scheduled Report is Ready</h2>
        <p>The report "${schedule.name}" has been generated successfully.</p>
        <p>Please find the attached ${schedule.format} file.</p>
        <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            This is an automated report. If you wish to unsubscribe or modify the schedule, 
            please contact your system administrator.
          </p>
        </div>
      </div>
    `

    // Send to each recipient
    const emailPromises = schedule.recipients.map(async (recipient: string) => {
      try {
        await sendEmail({
          to: recipient,
          subject,
          html: body,
          text: body.replace(/<[^>]*>/g, ''),
          attachments: [
            {
              filename: exportResult.fileName,
              content: exportResult.buffer,
              contentType: exportResult.mimeType
            }
          ]
        })
      } catch (error) {
        console.error(`Failed to send report to ${recipient}:`, error)
        // Don't throw - continue sending to other recipients
      }
    })

    await Promise.all(emailPromises)
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(
    frequency: ReportFrequency,
    cronExpression?: string | null,
    timezone: string = 'UTC'
  ): Date {
    // If custom cron expression provided
    if (frequency === 'ONCE') {
      return new Date(Date.now() + 60000) // 1 minute from now
    }

    if (cronExpression) {
      try {
        const interval = parser.parseExpression(cronExpression, {
          tz: timezone,
          currentDate: new Date()
        })
        return interval.next().toDate()
      } catch (error) {
        console.error('Invalid cron expression:', error)
      }
    }

    // Default schedules
    const now = new Date()
    const next = new Date(now)

    switch (frequency) {
      case 'DAILY':
        next.setDate(now.getDate() + 1)
        next.setHours(9, 0, 0, 0) // 9 AM next day
        break
      
      case 'WEEKLY':
        next.setDate(now.getDate() + 7)
        next.setHours(9, 0, 0, 0)
        break
      
      case 'BIWEEKLY':
        next.setDate(now.getDate() + 14)
        next.setHours(9, 0, 0, 0)
        break
      
      case 'MONTHLY':
        next.setMonth(now.getMonth() + 1)
        next.setDate(1) // First day of next month
        next.setHours(9, 0, 0, 0)
        break
      
      case 'QUARTERLY':
        next.setMonth(now.getMonth() + 3)
        next.setDate(1)
        next.setHours(9, 0, 0, 0)
        break
      
      case 'YEARLY':
        next.setFullYear(now.getFullYear() + 1)
        next.setMonth(0) // January
        next.setDate(1)
        next.setHours(9, 0, 0, 0)
        break
      
      default:
        next.setDate(now.getDate() + 1)
        next.setHours(9, 0, 0, 0)
    }

    return next
  }

  /**
   * Process all due schedules
   */
  async processDueSchedules() {
    const dueSchedules = await prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: new Date()
        }
      },
      include: {
        template: true
      }
    })

    const results = []
    
    for (const schedule of dueSchedules) {
      try {
        const result = await this.executeSchedule(schedule.id)
        results.push({ scheduleId: schedule.id, success: true, ...result })
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Get schedule history
   */
  async getScheduleHistory(scheduleId: string, limit: number = 10) {
    return await prisma.report.findMany({
      where: { scheduleId },
      orderBy: { generatedAt: 'desc' },
      take: limit,
      include: {
        template: true
      }
    })
  }
}

// Singleton instance
export const reportScheduler = new ReportScheduler()

// Optional: Set up cron job to process schedules
// This should be run in a background worker or cron job
export async function processScheduledReports() {
  try {
    const results = await reportScheduler.processDueSchedules()
    console.log(`Processed ${results.length} scheduled reports`)
    return results
  } catch (error) {
    console.error('Error processing scheduled reports:', error)
    throw error
  }
}
