"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ExportControlsProps {
  reportId?: string;
  reportName?: string;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function ExportControls({
  reportId,
  reportName = 'report',
  onExport,
  className,
  disabled = false
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<string>('');

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    setCurrentFormat(format);

    try {
      if (onExport) {
        await onExport(format);
      } else if (reportId) {
        // Default export implementation
        const response = await fetch(`/api/reports/${reportId}/export?format=${format}`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Report exported as ${format.toUpperCase()}`);
      } else {
        toast.error('No export handler or report ID provided');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setCurrentFormat('');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className={className}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting {currentFormat.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel Spreadsheet
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileCode className="mr-2 h-4 w-4" />
          CSV File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
