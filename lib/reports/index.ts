import { PDFGenerator } from './pdf-generator';
import { ExcelGenerator } from './excel-generator';
import { CSVGenerator } from './csv-generator';

export { PDFGenerator, type PDFExportOptions } from './pdf-generator';
export { ExcelGenerator, type ExcelExportOptions } from './excel-generator';
export { CSVGenerator, type CSVExportOptions } from './csv-generator';

// Re-export all generators as a single object
export const ReportGenerators = {
  PDF: PDFGenerator,
  Excel: ExcelGenerator,
  CSV: CSVGenerator
};

