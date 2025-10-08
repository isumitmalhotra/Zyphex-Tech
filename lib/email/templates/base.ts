/**
 * Base Email Template
 * 
 * Provides common structure and utilities for all email templates
 */

export interface BaseTemplateData {
  recipientName?: string
  appName?: string
  appUrl?: string
  supportEmail?: string
  year?: number
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Generate base HTML email structure
 */
export function generateBaseHTML(
  content: string,
  data: BaseTemplateData = {}
): string {
  const appName = data.appName || process.env.APP_NAME || 'Zyphex Tech'
  const appUrl = data.appUrl || process.env.APP_URL || 'https://zyphextech.com'
  const supportEmail = data.supportEmail || process.env.SUPPORT_EMAIL || 'support@zyphextech.com'
  const year = data.year || new Date().getFullYear()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${appName}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #f4f4f7;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
    }
    
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
      height: auto;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .email-header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.3;
    }
    
    .logo {
      margin-bottom: 20px;
    }
    
    /* Content */
    .email-content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    
    .email-content p {
      margin: 0 0 16px;
      color: #333333;
      font-size: 16px;
      line-height: 1.6;
    }
    
    .email-content h2 {
      margin: 24px 0 16px;
      color: #1a1a1a;
      font-size: 24px;
      font-weight: 600;
    }
    
    .email-content h3 {
      margin: 20px 0 12px;
      color: #333333;
      font-size: 18px;
      font-weight: 600;
    }
    
    .email-content ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    
    .email-content li {
      margin: 8px 0;
      color: #333333;
      font-size: 16px;
      line-height: 1.6;
    }
    
    /* Button */
    .button {
      display: inline-block;
      padding: 14px 32px;
      margin: 24px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      transition: transform 0.2s;
    }
    
    .button:hover {
      transform: translateY(-2px);
    }
    
    /* Info boxes */
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .info-box p {
      margin: 0;
      color: #495057;
      font-size: 14px;
    }
    
    .success-box {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
    }
    
    .success-box p {
      color: #155724;
    }
    
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
    }
    
    .warning-box p {
      color: #856404;
    }
    
    .error-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
    }
    
    .error-box p {
      color: #721c24;
    }
    
    /* Details table */
    .details-table {
      width: 100%;
      margin: 20px 0;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .details-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .details-table tr:last-child td {
      border-bottom: none;
    }
    
    .details-table .label {
      font-weight: 600;
      color: #495057;
      width: 40%;
    }
    
    .details-table .value {
      color: #212529;
    }
    
    /* Footer */
    .email-footer {
      padding: 30px;
      text-align: center;
      background-color: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }
    
    .email-footer p {
      margin: 8px 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .email-footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .email-footer a:hover {
      text-decoration: underline;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      
      .email-header,
      .email-content,
      .email-footer {
        padding: 20px !important;
      }
      
      .email-header h1 {
        font-size: 24px !important;
      }
      
      .button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
      }
      
      .details-table .label {
        width: 50% !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" style="width:100%;background-color:#f4f4f7;padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container">
          <tr>
            <td class="email-content">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="email-footer">
              <p><strong>${appName}</strong></p>
              <p>&copy; ${year} ${appName}. All rights reserved.</p>
              <p>
                Need help? Contact us at 
                <a href="mailto:${supportEmail}">${supportEmail}</a>
              </p>
              <p style="font-size: 12px; color: #999;">
                This email was sent to you because you have an account with ${appName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version from HTML
 */
export function generatePlainText(html: string): string {
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim
    .trim()
}

/**
 * Format a URL for email display
 */
export function formatUrl(url: string, text?: string): string {
  return `<a href="${url}" style="color: #667eea; text-decoration: none; font-weight: 600;">${text || url}</a>`
}

/**
 * Create a button link
 */
export function createButton(url: string, text: string): string {
  return `
    <table role="presentation" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${url}" class="button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block; font-weight: 600;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Create an info box
 */
export function createInfoBox(content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
  const boxClass = type === 'info' ? 'info-box' : 
                   type === 'success' ? 'success-box' :
                   type === 'warning' ? 'warning-box' : 'error-box'
  
  return `
    <div class="${boxClass}">
      <p>${content}</p>
    </div>
  `
}

/**
 * Create a details table
 */
export function createDetailsTable(details: Record<string, string>): string {
  const rows = Object.entries(details)
    .map(([label, value]) => `
      <tr>
        <td class="label">${label}</td>
        <td class="value">${value}</td>
      </tr>
    `)
    .join('')

  return `
    <table class="details-table">
      ${rows}
    </table>
  `
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}
