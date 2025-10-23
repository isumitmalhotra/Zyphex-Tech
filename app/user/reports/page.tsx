"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, Eye, Filter, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  status: string;
  generatedAt?: Date;
  pdfUrl?: string;
  excelUrl?: string;
  csvUrl?: string;
  viewCount: number;
  downloadCount: number;
  template?: {
    name: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  PROJECTS: 'Projects',
  FINANCIAL: 'Financial',
  TEAM: 'Team',
  CLIENTS: 'Clients',
  TIME: 'Time Tracking',
  CUSTOM: 'Custom',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  GENERATING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      setReports(data.reports || []);
      setPagination((prev) => data.pagination || prev);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    // Client-side search filtering
    let filtered = reports;

    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  const handleView = async (report: Report) => {
    if (report.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
      
      // Increment view count
      try {
        await fetch(`/api/reports/${report.id}/view`, { method: 'POST' });
        fetchReports();
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    } else {
      toast.error('Report file not available');
    }
  };

  const handleDownload = async (report: Report, format: 'pdf' | 'excel' | 'csv') => {
    const url = format === 'pdf' ? report.pdfUrl : format === 'excel' ? report.excelUrl : report.csvUrl;
    
    if (url) {
      window.open(url, '_blank');
      
      // Increment download count
      try {
        await fetch(`/api/reports/${report.id}/download`, { method: 'POST' });
        fetchReports();
      } catch (error) {
        console.error('Error updating download count:', error);
      }
    } else {
      toast.error(`${format.toUpperCase()} file not available`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View and download generated reports
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="GENERATING">Generating</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedStatus('');
                fetchReports();
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <Badge className={STATUS_COLORS[report.status]}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[report.category]}
                      </Badge>
                    </div>
                    {report.description && (
                      <CardDescription>{report.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {report.generatedAt
                        ? new Date(report.generatedAt).toLocaleDateString()
                        : 'Not generated'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {report.viewCount} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {report.downloadCount} downloads
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {report.status === 'COMPLETED' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(report)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {report.pdfUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(report, 'pdf')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        )}
                        {report.excelUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(report, 'excel')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                          </Button>
                        )}
                        {report.csvUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(report, 'csv')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            CSV
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || selectedCategory || selectedStatus
                ? 'Try adjusting your filters'
                : 'No reports have been generated yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
