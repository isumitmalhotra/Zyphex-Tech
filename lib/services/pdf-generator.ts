import puppeteer from 'puppeteer'

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
}

export class PDFGeneratorService {
  /**
   * Generate PDF from HTML content
   */
  async generatePDF(
    html: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    let browser = null

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || {
          top: '20mm',
          right: '10mm',
          bottom: '20mm',
          left: '10mm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        printBackground: options.printBackground !== false, // true by default
        preferCSSPageSize: true
      })

      return Buffer.from(pdfBuffer)
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * Generate PDF from URL
   */
  async generatePDFFromURL(
    url: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    let browser = null

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()
      await page.goto(url, {
        waitUntil: 'networkidle0'
      })

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || {
          top: '20mm',
          right: '10mm',
          bottom: '20mm',
          left: '10mm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        printBackground: options.printBackground !== false,
        preferCSSPageSize: true
      })

      return Buffer.from(pdfBuffer)
    } catch (error) {
      console.error('PDF generation from URL error:', error)
      throw new Error(
        `Failed to generate PDF from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * Generate invoice PDF with custom styling
   */
  async generateInvoicePDF(html: string): Promise<Buffer> {
    return this.generatePDF(html, {
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 8px; width: 100%; text-align: center; color: #64748b; margin-top: 5px;">
          Zyphex Technologies - Official Document
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; width: 100%; padding: 0 10mm; display: flex; justify-content: space-between; color: #64748b;">
          <span>Zyphex Technologies</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    })
  }

  /**
   * Generate receipt PDF with custom styling
   */
  async generateReceiptPDF(html: string): Promise<Buffer> {
    return this.generatePDF(html, {
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: false
    })
  }
}

// Singleton instance
export const pdfGenerator = new PDFGeneratorService()
