export interface CSVExportOptions {
  data: Record<string, unknown>[];
  columns?: { key: string; label: string }[];
  delimiter?: string;
  includeHeaders?: boolean;
  filename?: string;
}

export class CSVGenerator {
  /**
   * Generate CSV string from data
   */
  static generateCSV(options: CSVExportOptions): string {
    const {
      data,
      columns = [],
      delimiter = ',',
      includeHeaders = true
    } = options;

    if (!data || data.length === 0) {
      return '';
    }

    // Determine columns
    const cols = columns.length > 0
      ? columns
      : Object.keys(data[0]).map(key => ({ key, label: key }));

    const lines: string[] = [];

    // Add headers
    if (includeHeaders) {
      const headerLine = cols.map(col => this.escapeCSVValue(col.label, delimiter)).join(delimiter);
      lines.push(headerLine);
    }

    // Add data rows
    data.forEach(row => {
      const rowValues = cols.map(col => {
        const value = row[col.key];
        return this.escapeCSVValue(this.formatValue(value), delimiter);
      });
      lines.push(rowValues.join(delimiter));
    });

    return lines.join('\n');
  }

  /**
   * Generate CSV buffer (for file download)
   */
  static generateCSVBuffer(options: CSVExportOptions): Buffer {
    const csvString = this.generateCSV(options);
    return Buffer.from(csvString, 'utf-8');
  }

  /**
   * Format value for CSV
   */
  private static formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Escape CSV value (handle quotes and delimiters)
   */
  private static escapeCSVValue(value: string, delimiter: string): string {
    // If value contains delimiter, newline, or quote, wrap it in quotes
    if (
      value.includes(delimiter) ||
      value.includes('\n') ||
      value.includes('\r') ||
      value.includes('"')
    ) {
      // Escape existing quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return value;
  }

  /**
   * Parse CSV string to array of objects
   */
  static parseCSV(
    csvString: string,
    options: {
      delimiter?: string;
      hasHeaders?: boolean;
      headers?: string[];
    } = {}
  ): Record<string, string>[] {
    const { delimiter = ',', hasHeaders = true, headers } = options;

    const lines = csvString.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    const result: Record<string, string>[] = [];
    let headerRow: string[] = [];

    const startIndex = hasHeaders ? 1 : 0;

    // Get headers
    if (hasHeaders && lines.length > 0) {
      headerRow = this.parseCSVLine(lines[0], delimiter);
    } else if (headers) {
      headerRow = headers;
    } else {
      // Generate generic headers
      const firstLine = this.parseCSVLine(lines[0], delimiter);
      headerRow = firstLine.map((_, i) => `column_${i + 1}`);
    }

    // Parse data rows
    for (let i = startIndex; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      const row: Record<string, string> = {};

      headerRow.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      result.push(row);
    }

    return result;
  }

  /**
   * Parse a single CSV line (handles quoted values)
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  /**
   * Convert CSV to TSV (Tab-Separated Values)
   */
  static convertToTSV(options: CSVExportOptions): string {
    return this.generateCSV({ ...options, delimiter: '\t' });
  }

  /**
   * Generate CSV with custom formatting
   */
  static generateFormattedCSV(
    data: Record<string, unknown>[],
    formatters: Record<string, (value: unknown) => string>
  ): string {
    const formattedData = data.map(row => {
      const formattedRow: Record<string, unknown> = {};
      Object.keys(row).forEach(key => {
        const formatter = formatters[key];
        formattedRow[key] = formatter ? formatter(row[key]) : row[key];
      });
      return formattedRow;
    });

    return this.generateCSV({ data: formattedData });
  }
}
