/**
 * Activity Log Viewer Component
 * Displays filterable activity logs with pagination
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Download,
  Search,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface ActivityLogViewerProps {
  className?: string;
  initialFilters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
  };
}

/**
 * Activity Log Viewer Component
 * Shows all CMS activity with filtering
 */
export function ActivityLogViewer({
  className,
  initialFilters = {}
}: ActivityLogViewerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState(initialFilters.action || 'all');
  const [entityTypeFilter, setEntityTypeFilter] = useState(initialFilters.entityType || 'all');
  const [dateRange] = useState<{ start?: string; end?: string }>({});
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeUser: 'true'
      });

      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);
      if (initialFilters.userId) params.append('userId', initialFilters.userId);
      if (initialFilters.entityId) params.append('entityId', initialFilters.entityId);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await fetch(`/api/cms/activity-log?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      setLogs(data.data);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, dateRange, search, initialFilters]);

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle search (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchLogs();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, page, fetchLogs]);

  // Export logs
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ mode: 'export' });
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);

      const response = await fetch(`/api/cms/activity-log?${params}`);
      const data = await response.json();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Get action badge variant
  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('create') || action.includes('publish')) return 'default';
    if (action.includes('delete') || action.includes('archive')) return 'destructive';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    return 'outline';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Action filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="publish">Publish</SelectItem>
              <SelectItem value="unpublish">Unpublish</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
            </SelectContent>
          </Select>

          {/* Entity type filter */}
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              <SelectItem value="page">Pages</SelectItem>
              <SelectItem value="section">Sections</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="workflow">Workflows</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={fetchLogs}>
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>

          {/* Export */}
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </Card>

      {/* Logs table */}
      {error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      ) : isLoading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading activity logs...</p>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No activity logs found</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  {/* User */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={log.user?.image || undefined} />
                        <AvatarFallback>
                          {log.user?.name?.[0] || log.user?.email[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {log.user?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.user?.email || log.userId}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>

                  {/* Entity */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium capitalize">
                        {log.entityType}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.entityId.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>

                  {/* Time */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {format(new Date(log.createdAt), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>

                  {/* Details */}
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <span>{Object.keys(log.changes).length} changes</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
