/**
 * Bulk Progress Dialog
 * Shows progress and results of bulk operations
 */

'use client';

import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface BulkOperationResult {
  success: boolean;
  operation: string;
  entityType: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: {
    entityId: string;
    success: boolean;
    error?: string;
  }[];
  duration: number;
  errors?: string[];
}

export interface BulkProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isProcessing: boolean;
  progress: { current: number; total: number };
  result: BulkOperationResult | null;
  operation?: string;
}

/**
 * Bulk Progress Dialog Component
 * Displays real-time progress and final results of bulk operations
 * 
 * @example
 * ```tsx
 * const [showProgress, setShowProgress] = useState(false);
 * const { executeOperation, isProcessing, progress } = useBulkOperation();
 * const [result, setResult] = useState(null);
 * 
 * const handleBulkDelete = async () => {
 *   setShowProgress(true);
 *   const operationResult = await executeOperation({
 *     operation: 'delete',
 *     entityType: 'page',
 *     entityIds: selectedIds
 *   });
 *   setResult(operationResult);
 * };
 * 
 * return (
 *   <BulkProgressDialog
 *     open={showProgress}
 *     onOpenChange={setShowProgress}
 *     isProcessing={isProcessing}
 *     progress={progress}
 *     result={result}
 *     operation="delete"
 *   />
 * );
 * ```
 */
export function BulkProgressDialog({
  open,
  onOpenChange,
  isProcessing,
  progress,
  result,
  operation = 'operation'
}: BulkProgressDialogProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const progressPercentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isProcessing ? `Processing ${operation}...` : 'Operation Complete'}
          </DialogTitle>
          <DialogDescription>
            {isProcessing
              ? `Processing ${progress.current} of ${progress.total} items...`
              : result
              ? `Completed ${operation} on ${result.totalItems} items in ${(result.duration / 1000).toFixed(2)}s`
              : 'Operation finished'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{progress.current} / {progress.total}</span>
                <span>{progressPercentage}%</span>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Please wait while we process your request...
              </span>
            </div>
          )}

          {/* Results summary */}
          {!isProcessing && result && (
            <div className="space-y-4">
              {/* Success/Failure summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="text-sm font-medium">Succeeded</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.successCount}
                    </div>
                  </div>
                </div>

                {result.failureCount > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <div className="text-sm font-medium">Failed</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {result.failureCount}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Overall status */}
              {result.success ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    All operations completed successfully
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Some operations failed. See details below.
                  </span>
                </div>
              )}

              {/* Detailed results (expandable) */}
              {result.failureCount > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      View Error Details ({result.failureCount} errors)
                    </span>
                    {showDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showDetails && (
                    <div className="border-t p-4 space-y-2 max-h-64 overflow-y-auto">
                      {result.results
                        .filter(r => !r.success)
                        .map((item, index) => (
                          <div
                            key={item.entityId || index}
                            className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm"
                          >
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs text-muted-foreground truncate">
                                {item.entityId}
                              </div>
                              <div className="text-red-700 dark:text-red-300">
                                {item.error || 'Unknown error'}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isProcessing && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
