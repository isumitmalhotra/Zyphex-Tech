import { EmailTemplate } from './base';
import { format } from 'date-fns';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Zyphex Tech';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface MeetingInvitationData {
  recipientName: string;
  recipientEmail: string;
  meetingTitle: string;
  meetingDescription?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  location?: string;
  organizerName: string;
  organizerEmail: string;
  meetingType: string;
  meetingUrl?: string;
  agenda?: Array<{
    title: string;
    duration?: number;
  }>;
  isRequired: boolean;
  acceptUrl: string;
  declineUrl: string;
  tentativeUrl: string;
}

export interface MeetingReminderData {
  recipientName: string;
  recipientEmail: string;
  meetingTitle: string;
  startTime: Date;
  duration: number;
  location?: string;
  meetingUrl?: string;
  organizerName: string;
  hoursUntilMeeting: number;
}

export interface MeetingCancellationData {
  recipientName: string;
  recipientEmail: string;
  meetingTitle: string;
  startTime: Date;
  organizerName: string;
  reason?: string;
  proposedNewTime?: Date;
}

export interface MeetingUpdateData {
  recipientName: string;
  recipientEmail: string;
  meetingTitle: string;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
  newStartTime: Date;
  newEndTime: Date;
  location?: string;
  meetingUrl?: string;
}

export interface MeetingSummaryData {
  recipientName: string;
  recipientEmail: string;
  meetingTitle: string;
  date: Date;
  duration: number;
  attendees: Array<{
    name: string;
    attended: boolean;
  }>;
  notes?: string;
  actionItems: Array<{
    title: string;
    assignee?: string;
    dueDate?: Date;
  }>;
  recordingUrl?: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generate meeting invitation email
 */
export function generateMeetingInvitationEmail(data: MeetingInvitationData): EmailTemplate {
  const startTimeFormatted = format(data.startTime, 'EEEE, MMMM d, yyyy');
  const timeFormatted = format(data.startTime, 'h:mm a');
  const endTimeFormatted = format(data.endTime, 'h:mm a');

  const agendaText = data.agenda && data.agenda.length > 0
    ? data.agenda.map((item, index) => 
        `${index + 1}. ${item.title}${item.duration ? ` (${item.duration} min)` : ''}`
      ).join('\n')
    : '';

  const subject = `Meeting Invitation: ${data.meetingTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                📅 Meeting Invitation
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${data.recipientName},
              </p>

              <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                You have been invited to a meeting by <strong>${data.organizerName}</strong>.
                ${data.isRequired ? '<br><span style="color: #f59e0b; font-weight: 600;">⚠️ Your attendance is required.</span>' : ''}
              </p>

              <!-- Meeting Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px; font-weight: 600;">
                      ${data.meetingTitle}
                    </h2>
                    
                    ${data.meetingDescription ? `
                      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
                        ${data.meetingDescription}
                      </p>
                    ` : ''}

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 14px;">📅</span>
                          <strong style="color: #334155; font-size: 14px; margin-left: 8px;">Date:</strong>
                          <span style="color: #64748b; font-size: 14px; margin-left: 4px;">${startTimeFormatted}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 14px;">🕐</span>
                          <strong style="color: #334155; font-size: 14px; margin-left: 8px;">Time:</strong>
                          <span style="color: #64748b; font-size: 14px; margin-left: 4px;">${timeFormatted} - ${endTimeFormatted} (${data.duration} minutes)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 14px;">${data.meetingType === 'VIDEO_CALL' ? '📹' : data.meetingType === 'PHONE_CALL' ? '📞' : '📍'}</span>
                          <strong style="color: #334155; font-size: 14px; margin-left: 8px;">Type:</strong>
                          <span style="color: #64748b; font-size: 14px; margin-left: 4px;">${data.meetingType.replace('_', ' ')}</span>
                        </td>
                      </tr>
                      ${data.location ? `
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #64748b; font-size: 14px;">📍</span>
                            <strong style="color: #334155; font-size: 14px; margin-left: 8px;">Location:</strong>
                            <span style="color: #64748b; font-size: 14px; margin-left: 4px;">${data.location}</span>
                          </td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 14px;">👤</span>
                          <strong style="color: #334155; font-size: 14px; margin-left: 8px;">Organizer:</strong>
                          <span style="color: #64748b; font-size: 14px; margin-left: 4px;">${data.organizerName}</span>
                        </td>
                      </tr>
                    </table>

                    ${agendaText ? `
                      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <strong style="color: #334155; font-size: 14px;">📋 Agenda:</strong>
                        <div style="margin-top: 12px; color: #64748b; font-size: 14px; line-height: 1.8; white-space: pre-line;">
${agendaText}
                        </div>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- RSVP Buttons -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 16px; color: #666666; font-size: 14px;">
                      Will you attend this meeting?
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="${data.acceptUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            ✓ Accept
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="${data.tentativeUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            ? Tentative
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="${data.declineUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            ✕ Decline
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${data.meetingUrl ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                  <tr>
                    <td align="center">
                      <a href="${data.meetingUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
                        🎥 Join Meeting
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}

              <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                This meeting has been added to your calendar. You can manage your response in the ${appName} platform.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                This invitation was sent by ${appName}
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                <a href="${appUrl}/project-manager/meetings" style="color: #667eea; text-decoration: none;">View in Calendar</a> •
                <a href="${appUrl}/settings/notifications" style="color: #667eea; text-decoration: none;">Notification Settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
MEETING INVITATION

Hello ${data.recipientName},

You have been invited to a meeting by ${data.organizerName}.
${data.isRequired ? '⚠️ YOUR ATTENDANCE IS REQUIRED' : ''}

MEETING DETAILS:
================

Title: ${data.meetingTitle}
${data.meetingDescription ? `Description: ${data.meetingDescription}\n` : ''}

Date: ${startTimeFormatted}
Time: ${timeFormatted} - ${endTimeFormatted} (${data.duration} minutes)
Type: ${data.meetingType.replace('_', ' ')}
${data.location ? `Location: ${data.location}\n` : ''}
Organizer: ${data.organizerName}

${agendaText ? `AGENDA:\n${agendaText}\n` : ''}

RSVP:
=====
Accept: ${data.acceptUrl}
Tentative: ${data.tentativeUrl}
Decline: ${data.declineUrl}

${data.meetingUrl ? `JOIN MEETING:\n${data.meetingUrl}\n` : ''}

This invitation was sent by ${appName}.
View in Calendar: ${appUrl}/project-manager/meetings

---
${appName} • ${appUrl}
`;

  return {
    subject,
    html,
    text,
  };
}

/**
 * Generate meeting reminder email
 */
export function generateMeetingReminderEmail(data: MeetingReminderData): EmailTemplate {
  const startTimeFormatted = format(data.startTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  
  const subject = `Reminder: ${data.meetingTitle} in ${data.hoursUntilMeeting} hour${data.hoursUntilMeeting > 1 ? 's' : ''}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ⏰ Meeting Reminder
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${data.recipientName},
              </p>

              <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                This is a friendly reminder that you have an upcoming meeting <strong>in ${data.hoursUntilMeeting} hour${data.hoursUntilMeeting > 1 ? 's' : ''}</strong>.
              </p>

              <!-- Meeting Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #92400e; font-size: 20px; font-weight: 600;">
                      ${data.meetingTitle}
                    </h2>
                    
                    <p style="margin: 0 0 8px; color: #78350f; font-size: 14px;">
                      <strong>When:</strong> ${startTimeFormatted}
                    </p>
                    <p style="margin: 0 0 8px; color: #78350f; font-size: 14px;">
                      <strong>Duration:</strong> ${data.duration} minutes
                    </p>
                    ${data.location ? `
                      <p style="margin: 0; color: #78350f; font-size: 14px;">
                        <strong>Location:</strong> ${data.location}
                      </p>
                    ` : ''}
                    <p style="margin: 8px 0 0; color: #78350f; font-size: 14px;">
                      <strong>Organizer:</strong> ${data.organizerName}
                    </p>
                  </td>
                </tr>
              </table>

              ${data.meetingUrl ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                  <tr>
                    <td align="center">
                      <a href="${data.meetingUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
                        🎥 Join Meeting Now
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}

              <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center;">
                Make sure you're ready a few minutes early!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                <a href="${appUrl}/project-manager/meetings" style="color: #667eea; text-decoration: none;">View All Meetings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
MEETING REMINDER

Hello ${data.recipientName},

This is a friendly reminder that you have an upcoming meeting in ${data.hoursUntilMeeting} hour${data.hoursUntilMeeting > 1 ? 's' : ''}.

MEETING DETAILS:
================

Title: ${data.meetingTitle}
When: ${startTimeFormatted}
Duration: ${data.duration} minutes
${data.location ? `Location: ${data.location}\n` : ''}
Organizer: ${data.organizerName}

${data.meetingUrl ? `JOIN MEETING:\n${data.meetingUrl}\n` : ''}

Make sure you're ready a few minutes early!

View All Meetings: ${appUrl}/project-manager/meetings

---
${appName} • ${appUrl}
`;

  return {
    subject,
    html,
    text,
  };
}

/**
 * Generate meeting cancellation email
 */
export function generateMeetingCancellationEmail(data: MeetingCancellationData): EmailTemplate {
  const startTimeFormatted = format(data.startTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  
  const subject = `Cancelled: ${data.meetingTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🚫 Meeting Cancelled
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${data.recipientName},
              </p>

              <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                The following meeting has been <strong style="color: #ef4444;">cancelled</strong> by ${data.organizerName}.
              </p>

              <!-- Meeting Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #7f1d1d; font-size: 20px; font-weight: 600; text-decoration: line-through;">
                      ${data.meetingTitle}
                    </h2>
                    
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px;">
                      <strong>Was scheduled for:</strong> ${startTimeFormatted}
                    </p>
                    
                    ${data.reason ? `
                      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #fecaca;">
                        <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">
                          Reason:
                        </p>
                        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                          ${data.reason}
                        </p>
                      </div>
                    ` : ''}

                    ${data.proposedNewTime ? `
                      <div style="margin-top: 16px; padding: 16px; background-color: #ffffff; border-radius: 4px;">
                        <p style="margin: 0; color: #10b981; font-size: 14px; font-weight: 600;">
                          ✓ Proposed new time: ${format(data.proposedNewTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center;">
                This meeting has been removed from your calendar. ${data.proposedNewTime ? 'Please watch for a new invitation with the proposed time.' : ''}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                <a href="${appUrl}/project-manager/meetings" style="color: #667eea; text-decoration: none;">View All Meetings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
MEETING CANCELLED

Hello ${data.recipientName},

The following meeting has been CANCELLED by ${data.organizerName}.

MEETING DETAILS:
================

Title: ${data.meetingTitle}
Was scheduled for: ${startTimeFormatted}

${data.reason ? `REASON:\n${data.reason}\n` : ''}
${data.proposedNewTime ? `\nProposed new time: ${format(data.proposedNewTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}\n` : ''}

This meeting has been removed from your calendar.

View All Meetings: ${appUrl}/project-manager/meetings

---
${appName} • ${appUrl}
`;

  return {
    subject,
    html,
    text,
  };
}

/**
 * Generate meeting summary email
 */
export function generateMeetingSummaryEmail(data: MeetingSummaryData): EmailTemplate {
  const dateFormatted = format(data.date, 'EEEE, MMMM d, yyyy');
  
  const subject = `Meeting Summary: ${data.meetingTitle}`;

  const attendeesText = data.attendees
    .map(a => `${a.attended ? '✓' : '✗'} ${a.name}`)
    .join('\n');

  const actionItemsText = data.actionItems
    .map((item, index) => 
      `${index + 1}. ${item.title}${item.assignee ? ` - Assigned to: ${item.assignee}` : ''}${item.dueDate ? ` - Due: ${format(item.dueDate, 'MMM d, yyyy')}` : ''}`
    )
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ✅ Meeting Summary
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 22px; font-weight: 600;">
                ${data.meetingTitle}
              </h2>
              <p style="margin: 0 0 30px; color: #64748b; font-size: 14px;">
                ${dateFormatted} • ${data.duration} minutes
              </p>

              <!-- Attendance -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px; color: #334155; font-size: 16px; font-weight: 600;">
                  👥 Attendance
                </h3>
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px;">
                  ${data.attendees.map(a => `
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      <span style="color: ${a.attended ? '#10b981' : '#ef4444'}; font-weight: 600;">${a.attended ? '✓' : '✗'}</span>
                      ${a.name}
                    </p>
                  `).join('')}
                </div>
              </div>

              <!-- Notes -->
              ${data.notes ? `
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 12px; color: #334155; font-size: 16px; font-weight: 600;">
                    📝 Meeting Notes
                  </h3>
                  <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; color: #64748b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${data.notes}
                  </div>
                </div>
              ` : ''}

              <!-- Action Items -->
              ${data.actionItems.length > 0 ? `
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 12px; color: #334155; font-size: 16px; font-weight: 600;">
                    ✓ Action Items
                  </h3>
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px;">
                    ${data.actionItems.map((item, index) => `
                      <div style="margin-bottom: ${index < data.actionItems.length - 1 ? '12px' : '0'}; padding-bottom: ${index < data.actionItems.length - 1 ? '12px' : '0'}; ${index < data.actionItems.length - 1 ? 'border-bottom: 1px solid #fde68a' : ''};">
                        <p style="margin: 0 0 4px; color: #92400e; font-size: 14px; font-weight: 600;">
                          ${index + 1}. ${item.title}
                        </p>
                        ${item.assignee ? `
                          <p style="margin: 0; color: #78350f; font-size: 13px;">
                            Assigned to: ${item.assignee}${item.dueDate ? ` • Due: ${format(item.dueDate, 'MMM d, yyyy')}` : ''}
                          </p>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Recording & Attachments -->
              ${data.recordingUrl || (data.attachments && data.attachments.length > 0) ? `
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 12px; color: #334155; font-size: 16px; font-weight: 600;">
                    📎 Resources
                  </h3>
                  <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px;">
                    ${data.recordingUrl ? `
                      <p style="margin: 0 0 8px;">
                        <a href="${data.recordingUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                          🎥 View Recording
                        </a>
                      </p>
                    ` : ''}
                    ${data.attachments && data.attachments.length > 0 ? data.attachments.map(att => `
                      <p style="margin: 0 0 8px;">
                        <a href="${att.url}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                          📄 ${att.name}
                        </a>
                      </p>
                    `).join('') : ''}
                  </div>
                </div>
              ` : ''}

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/project-manager/meetings" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      View All Meetings
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                ${appName} • Meeting Summary
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
MEETING SUMMARY

${data.meetingTitle}
${dateFormatted} • ${data.duration} minutes

ATTENDANCE:
===========
${attendeesText}

${data.notes ? `MEETING NOTES:\n==============\n${data.notes}\n` : ''}

${data.actionItems.length > 0 ? `ACTION ITEMS:\n=============\n${actionItemsText}\n` : ''}

${data.recordingUrl ? `RECORDING:\n${data.recordingUrl}\n` : ''}
${data.attachments && data.attachments.length > 0 ? `\nATTACHMENTS:\n${data.attachments.map(a => `${a.name}: ${a.url}`).join('\n')}\n` : ''}

View All Meetings: ${appUrl}/project-manager/meetings

---
${appName} • ${appUrl}
`;

  return {
    subject,
    html,
    text,
  };
}
