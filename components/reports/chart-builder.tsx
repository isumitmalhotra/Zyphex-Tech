"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableView, TableColumn } from './table-view';

export type ChartType = 'bar' | 'line' | 'pie' | 'table';

export interface ChartBuilderProps {
  title?: string;
  description?: string;
  data: Record<string, unknown>[];
  defaultChartType?: ChartType;
  className?: string;
  onChartTypeChange?: (type: ChartType) => void;
}

export function ChartBuilder({
  title,
  description,
  data,
  defaultChartType = 'bar',
  className,
  onChartTypeChange
}: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ChartComponent, setChartComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Load chart component dynamically based on type
  useEffect(() => {
    if (chartType === 'table' || typeof window === 'undefined') {
      setChartComponent(null);
      return;
    }

    setIsLoadingChart(true);
    let cancelled = false;

    async function loadChart() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let chartModule: any;
        switch (chartType) {
          case 'bar':
            chartModule = await import('./bar-chart');
            if (!cancelled) setChartComponent(() => chartModule.BarChart);
            break;
          case 'line':
            chartModule = await import('./line-chart');
            if (!cancelled) setChartComponent(() => chartModule.LineChart);
            break;
          case 'pie':
            chartModule = await import('./pie-chart');
            if (!cancelled) setChartComponent(() => chartModule.PieChart);
            break;
        }
      } catch (error) {
        console.error('Error loading chart:', error);
      } finally {
        if (!cancelled) setIsLoadingChart(false);
      }
    }

    loadChart();

    return () => {
      cancelled = true;
    };
  }, [chartType]);

  // Extract available columns from data
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // Prepare chart data based on selections
  const prepareChartData = () => {
    if (!xAxis || (!yAxis && chartType !== 'table')) {
      return null;
    }

    if (chartType === 'table') {
      return {
        columns: columns.map(col => ({
          key: col,
          label: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          sortable: true
        })) as TableColumn[],
        data
      };
    }

    const labels = data.map(row => String(row[xAxis]));
    const values = data.map(row => Number(row[yAxis]) || 0);

    if (chartType === 'pie') {
      return {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        }]
      };
    }

    return {
      labels,
      datasets: [{
        label: yAxis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: values,
        backgroundColor: chartType === 'bar' ? 'rgba(54, 162, 235, 0.8)' : 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: chartType === 'line' ? 0.3 : 0,
        fill: chartType === 'line',
      }]
    };
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    if (!chartData) {
      return (
        <div className="flex items-center justify-center p-12 text-muted-foreground border rounded-lg">
          Please select {chartType !== 'table' ? 'X and Y axes' : 'data'} to visualize the chart
        </div>
      );
    }

    if (chartType === 'table' && 'columns' in chartData && 'data' in chartData) {
      return (
        <TableView
          columns={chartData.columns as TableColumn[]}
          data={chartData.data as Record<string, unknown>[]}
          searchable
        />
      );
    }

    if (isLoadingChart) {
      return (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          Loading chart...
        </div>
      );
    }

    if (!ChartComponent) {
      return (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          Chart component not loaded
        </div>
      );
    }

    // Render the dynamically loaded chart component
    if ('labels' in chartData && 'datasets' in chartData) {
      return <ChartComponent data={chartData} height={400} />;
    }

    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Configuration */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select
              value={chartType}
              onValueChange={(value) => handleChartTypeChange(value as ChartType)}
            >
              <SelectTrigger id="chart-type">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="table">Table View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {chartType !== 'table' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="x-axis">X-Axis (Labels)</Label>
                <Select value={xAxis} onValueChange={setXAxis}>
                  <SelectTrigger id="x-axis">
                    <SelectValue placeholder="Select X-axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="y-axis">Y-Axis (Values)</Label>
                <Select value={yAxis} onValueChange={setYAxis}>
                  <SelectTrigger id="y-axis">
                    <SelectValue placeholder="Select Y-axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Chart Visualization */}
        <div className="mt-6">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
