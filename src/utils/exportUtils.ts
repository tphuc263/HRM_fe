import * as XLSX from 'xlsx';

/**
 * Downloads data as an Excel file (.xlsx)
 * @param fileName - Name of the file without extension (e.g. "employees")
 * @param headers - Array of header strings
 * @param rows - Array of arrays containing row data
 */
export function downloadExcel(fileName: string, headers: string[], rows: any[][]) {
  // Combine headers and rows
  const data = [headers, ...rows];
  
  // Create a new workbook and a worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // Save the file
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
