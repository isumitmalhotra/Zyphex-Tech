import puppeteer from 'puppeteer';

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  data: Record<string, unknown>[] | string; // Table data or HTML content
  columns?: { key: string; label: string }[];
  orientation?: 'portrait' | 'landscape';
  format?: 'A4' | 'Letter';
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyName?: string;
  companyLogo?: string;
}

export class PDFGenerator {
  private static generateHTML(options: PDFExportOptions): string {
    const {
      title = 'Report',
      subtitle,
      data,
      columns = [],
      companyName = 'Zyphex Tech',
      companyLogo
    } = options;

    const isTableData = Array.isArray(data);

    // Generate table HTML
    const tableHTML = isTableData && columns.length > 0
      ? `
        <table class="data-table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => `<td>${String(row[col.key] ?? '')}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : typeof data === 'string'
      ? data
      : '<p>No data available</p>';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              margin: 1.5cm 1cm;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              font-size: 10pt;
              line-height: 1.6;
              color: #333;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #2563eb;
            }

            .header-left {
              flex: 1;
            }

            .header-right {
              text-align: right;
            }

            .company-logo {
              max-height: 50px;
              max-width: 150px;
            }

            .company-name {
              font-size: 18pt;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }

            .report-title {
              font-size: 24pt;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 10px;
            }

            .report-subtitle {
              font-size: 12pt;
              color: #64748b;
              margin-bottom: 20px;
            }

            .report-date {
              font-size: 9pt;
              color: #94a3b8;
            }

            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              margin-bottom: 20px;
            }

            .data-table thead {
              background-color: #2563eb;
              color: white;
            }

            .data-table th {
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #cbd5e1;
            }

            .data-table td {
              padding: 10px 8px;
              border: 1px solid #e2e8f0;
            }

            .data-table tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }

            .data-table tbody tr:hover {
              background-color: #f1f5f9;
            }

            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 9pt;
              color: #94a3b8;
            }

            .page-number {
              text-align: center;
              font-size: 9pt;
              color: #94a3b8;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" class="company-logo" />` : ''}
              <div class="company-name">${companyName}</div>
            </div>
            <div class="header-right">
              <div class="report-date">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="report-title">${title}</div>
          ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}

          <div class="content">
            ${tableHTML}
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  static async generatePDF(options: PDFExportOptions): Promise<Buffer> {
    let browser;

    try {
      // Generate HTML content
      const html = this.generateHTML(options);

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '1.5cm',
          right: '1cm',
          bottom: '1.5cm',
          left: '1cm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
