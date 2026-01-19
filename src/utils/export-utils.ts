/**
 * Export Utility Functions
 * Reusable functions for exporting data to CSV/Excel formats
 */

// ----------------------------------------------------------------------

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
export function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  headers: string[],
  filename: string = `export_${new Date().toISOString().split('T')[0]}.csv`,
  includeHeaders: boolean = true
) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const rows: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    rows.push(headers.map((header) => escapeCSVValue(header)).join(','));
  }

  // Add data rows
  data.forEach((item) => {
    const values = headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return escapeCSVValue(JSON.stringify(value));
      return escapeCSVValue(String(value));
    });
    rows.push(values.join(','));
  });

  // Create and download file
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as Excel file (tab-separated values for better Excel compatibility)
 */
export function downloadExcel<T extends Record<string, any>>(
  data: T[],
  headers: string[],
  filename: string = `export_${new Date().toISOString().split('T')[0]}.xlsx`,
  includeHeaders: boolean = true
) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const rows: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    rows.push(headers.map((header) => escapeCSVValue(header)).join('\t'));
  }

  // Add data rows
  data.forEach((item) => {
    const values = headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return escapeCSVValue(JSON.stringify(value));
      return escapeCSVValue(String(value));
    });
    rows.push(values.join('\t'));
  });

  // Create and download file
  const content = rows.join('\n');
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
