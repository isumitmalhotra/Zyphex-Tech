import { toast } from "sonner"

/**
 * Export data to CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param columns - Optional: specific columns to include
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  try {
    if (data.length === 0) {
      toast.error("No data to export")
      return
    }

    // Determine columns
    const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }))
    
    // Create CSV header
    const header = cols.map(col => `"${col.label}"`).join(",")
    
    // Create CSV rows
    const rows = data.map(item => {
      return cols.map(col => {
        const value = item[col.key]
        
        // Handle different types
        if (value === null || value === undefined) {
          return '""'
        }
        
        // Check if it's a Date object by checking if it has toISOString method
        if (typeof value === 'object' && value && 'toISOString' in value && typeof value.toISOString === 'function') {
          return `"${value.toISOString()}"`
        }
        
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(",")
    })
    
    // Combine header and rows
    const csv = [header, ...rows].join("\n")
    
    // Create and download file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} records to CSV`)
  } catch (error) {
    console.error("Export error:", error)
    toast.error("Failed to export data. Please try again.")
  }
}

/**
 * Format data for export by flattening nested objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenForExport<T extends Record<string, any>>(data: T[]): Record<string, unknown>[] {
  return data.map(item => {
    const flattened: Record<string, unknown> = {}
    
    Object.entries(item).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Flatten nested object
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flattened[`${key}_${nestedKey}`] = nestedValue
        })
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[key] = value.join(", ")
      } else {
        flattened[key] = value
      }
    })
    
    return flattened
  })
}

/**
 * Download text as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
