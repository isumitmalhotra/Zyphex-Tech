import ExcelJS from 'exceljs';

export interface ExcelExportOptions {
  title?: string;
  sheetName?: string;
  data: Record<string, unknown>[];
  columns?: { key: string; label: string; width?: number }[];
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyName?: string;
}

export class ExcelGenerator {
  static async generateExcel(options: ExcelExportOptions): Promise<Buffer> {
    try {
      const {
        title = 'Report',
        sheetName = 'Sheet1',
        data,
        columns = [],
        includeHeader = true,
        includeFooter = true,
        companyName = 'Zyphex Tech'
      } = options;

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = companyName;
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet(sheetName);

      let currentRow = 1;

      // Add header section
      if (includeHeader) {
        // Title row
        const titleRow = worksheet.getRow(currentRow);
        titleRow.getCell(1).value = title;
        titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
        titleRow.height = 25;
        currentRow++;

        // Subtitle row (company and date)
        const subtitleRow = worksheet.getRow(currentRow);
        subtitleRow.getCell(1).value = companyName;
        subtitleRow.getCell(1).font = { size: 11, italic: true };
        
        // Calculate last column for date alignment
        const lastCol = columns.length > 0 ? columns.length : Object.keys(data[0] || {}).length;
        if (lastCol > 0) {
          subtitleRow.getCell(lastCol).value = `Generated: ${new Date().toLocaleString()}`;
          subtitleRow.getCell(lastCol).font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
          subtitleRow.getCell(lastCol).alignment = { horizontal: 'right' };
        }
        
        currentRow++;
        currentRow++; // Empty row
      }

      // Determine columns
      const cols = columns.length > 0
        ? columns
        : Object.keys(data[0] || {}).map(key => ({ key, label: key, width: 15 }));

      // Set column headers
      worksheet.columns = cols.map(col => ({
        header: col.label,
        key: col.key,
        width: col.width || 15
      }));

      // Style header row
      const headerRow = worksheet.getRow(currentRow);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
      headerRow.height = 20;

      // Add borders to header
      cols.forEach((_, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      currentRow++;

      // Add data rows
      data.forEach((row) => {
        const dataRow = worksheet.getRow(currentRow);
        cols.forEach((col, index) => {
          const cell = dataRow.getCell(index + 1);
          const value = row[col.key];

          // Format cell value
          if (value instanceof Date) {
            cell.value = value;
            cell.numFmt = 'yyyy-mm-dd';
          } else if (typeof value === 'number') {
            cell.value = value;
            // If it looks like currency, format as such
            if (col.key.toLowerCase().includes('amount') || 
                col.key.toLowerCase().includes('price') ||
                col.key.toLowerCase().includes('cost')) {
              cell.numFmt = '$#,##0.00';
            }
          } else {
            cell.value = value !== null && value !== undefined ? String(value) : '';
          }

          // Add borders
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Alternate row colors
          if (currentRow % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }
        });

        currentRow++;
      });

      // Add footer section
      if (includeFooter) {
        currentRow++; // Empty row
        const footerRow = worksheet.getRow(currentRow);
        footerRow.getCell(1).value = `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
        footerRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };
        footerRow.getCell(1).alignment = { horizontal: 'center' };
        
        // Merge footer cells
        if (cols.length > 1) {
          worksheet.mergeCells(currentRow, 1, currentRow, cols.length);
        }
      }

      // Auto-fit columns (optional enhancement)
      worksheet.columns.forEach(column => {
        if (!column.width) {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: false }, cell => {
            const cellLength = cell.value ? String(cell.value).length : 0;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Excel generation error:', error);
      throw new Error(`Failed to generate Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateMultiSheetExcel(
    sheets: Array<{
      name: string;
      data: Record<string, unknown>[];
      columns?: { key: string; label: string; width?: number }[];
    }>,
    options: { title?: string; companyName?: string } = {}
  ): Promise<Buffer> {
    try {
      const { title = 'Report', companyName = 'Zyphex Tech' } = options;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = companyName;
      workbook.created = new Date();
      workbook.modified = new Date();

      for (const sheetData of sheets) {
        const worksheet = workbook.addWorksheet(sheetData.name);

        // Add title
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = `${title} - ${sheetData.name}`;
        titleRow.getCell(1).font = { size: 14, bold: true };
        titleRow.height = 20;

        // Determine columns
        const cols = sheetData.columns?.length
          ? sheetData.columns
          : Object.keys(sheetData.data[0] || {}).map(key => ({ key, label: key, width: 15 }));

        // Set columns
        worksheet.columns = cols.map(col => ({
          header: col.label,
          key: col.key,
          width: col.width || 15
        }));

        // Style header
        const headerRow = worksheet.getRow(3);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };

        // Add data
        sheetData.data.forEach(row => {
          worksheet.addRow(row);
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Multi-sheet Excel generation error:', error);
      throw new Error(`Failed to generate multi-sheet Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
