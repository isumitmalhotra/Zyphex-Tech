"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBuilder } from '@/components/reports/chart-builder';
import { ExportControls } from '@/components/reports/export-controls';
import { Filter, BarChart3, Save, Play, FileText } from 'lucide-react';
import { toast } from 'sonner';

const REPORT_CATEGORIES = [
  { value: 'PROJECTS', label: 'Projects' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'TEAM', label: 'Team' },
  { value: 'CLIENTS', label: 'Clients' },
  { value: 'TIME', label: 'Time Tracking' },
  { value: 'CUSTOM', label: 'Custom' },
];

const REPORT_TYPES = [
  { value: 'PROJECT_STATUS', label: 'Project Status', category: 'PROJECTS' },
  { value: 'PROJECT_TIMELINE', label: 'Project Timeline', category: 'PROJECTS' },
  { value: 'TASK_COMPLETION', label: 'Task Completion', category: 'PROJECTS' },
  { value: 'RESOURCE_ALLOCATION', label: 'Resource Allocation', category: 'PROJECTS' },
  { value: 'REVENUE_BY_PROJECT', label: 'Revenue by Project', category: 'FINANCIAL' },
  { value: 'PROFITABILITY_ANALYSIS', label: 'Profitability Analysis', category: 'FINANCIAL' },
  { value: 'BUDGET_VS_ACTUAL', label: 'Budget vs Actual', category: 'FINANCIAL' },
  { value: 'INVOICE_STATUS', label: 'Invoice Status', category: 'FINANCIAL' },
  { value: 'TEAM_PRODUCTIVITY', label: 'Team Productivity', category: 'TEAM' },
  { value: 'INDIVIDUAL_PERFORMANCE', label: 'Individual Performance', category: 'TEAM' },
  { value: 'WORKLOAD_DISTRIBUTION', label: 'Workload Distribution', category: 'TEAM' },
  { value: 'TIME_TRACKING', label: 'Time Tracking', category: 'TIME' },
  { value: 'CLIENT_SATISFACTION', label: 'Client Satisfaction', category: 'CLIENTS' },
  { value: 'CUSTOM', label: 'Custom Report', category: 'CUSTOM' },
];

const DATA_SOURCES = [
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'timeEntries', label: 'Time Entries' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'payments', label: 'Payments' },
  { value: 'clients', label: 'Clients' },
  { value: 'users', label: 'Users/Team Members' },
];

export default function ReportBuilderPage() {
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [reportType, setReportType] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter available report types based on selected category
  const availableTypes = reportType
    ? REPORT_TYPES
    : REPORT_TYPES.filter(type => !category || type.category === category);

  // Fetch preview data when configuration changes
  useEffect(() => {
    const loadData = async () => {
      if (!dataSource) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateRange.start) params.append('startDate', dateRange.start);
        if (dateRange.end) params.append('endDate', dateRange.end);
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const response = await fetch(`/api/reports/data/${dataSource}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        setPreviewData(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Error fetching preview data:', error);
        toast.error('Failed to load preview data');
        setPreviewData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dataSource, dateRange.start, dateRange.end, filters]);

  const handleSaveReport = async () => {
    if (!reportName || !category || !reportType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description,
          category,
          type: reportType,
          config: {
            dataSource,
            dateRange,
            filters,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save report');

      await response.json();
      toast.success('Report saved successfully!');
      
      // Reset form or redirect
      setReportName('');
      setDescription('');
      setCategory('');
      setReportType('');
      setDataSource('');
      setDateRange({ start: '', end: '' });
      setFilters({});
      setPreviewData([]);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportName || !category || !reportType) {
      toast.error('Please configure the report first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          category,
          type: reportType,
          config: {
            dataSource,
            dateRange,
            filters,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const result = await response.json();
      toast.success('Report generated successfully!');
      
      // Open or download the report
      if (result.pdfUrl) {
        window.open(result.pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-muted-foreground">
            Create custom reports with drag-and-drop interface
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveReport} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Report'}
          </Button>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configure">
            <FileText className="mr-2 h-4 w-4" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="preview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Define basic information about your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name *</Label>
                  <Input
                    id="reportName"
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type *</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="reportType">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Select value={dataSource} onValueChange={setDataSource}>
                    <SelectTrigger id="dataSource">
                      <SelectValue placeholder="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter report description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date Range & Filters</CardTitle>
              <CardDescription>
                Set date range and additional filters for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic filters based on data source */}
              {dataSource === 'projects' && (
                <div className="space-y-2">
                  <Label htmlFor="projectStatus">Project Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger id="projectStatus">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {dataSource === 'invoices' && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceStatus">Invoice Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger id="invoiceStatus">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>
                    Preview your report data and visualization
                  </CardDescription>
                </div>
                <ExportControls
                  reportName={reportName || 'report'}
                  disabled={previewData.length === 0}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                </div>
              ) : previewData.length > 0 ? (
                <ChartBuilder data={previewData} defaultChartType="table" />
              ) : (
                <div className="flex items-center justify-center p-12 border rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {dataSource
                        ? 'No data available for the selected filters'
                        : 'Select a data source to preview your report'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
