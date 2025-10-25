"use client";

import React, { useEffect, useState } from 'react';
// Dynamic imports to prevent SSR issues
import type { ChartOptions } from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface LineChartProps {
  title?: string;
  description?: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }[];
  };
  options?: ChartOptions<'line'>;
  height?: number;
  className?: string;
}

export function LineChart({
  title,
  description,
  data,
  options,
  height = 300,
  className
}: LineChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [LineComponent, setLineComponent] = useState<React.ComponentType<any> | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // Load Chart.js dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    Promise.all([
      import('chart.js'),
      import('react-chartjs-2')
    ]).then(([chartModule, reactChartModule]) => {
      const {
        Chart: ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler
      } = chartModule;
      ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler
      );
      setLineComponent(() => reactChartModule.Line);
      setChartReady(true);
    }).catch(error => {
      console.error('Error loading Chart.js:', error);
    });
  }, []);

  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const mergedOptions = options ? { ...defaultOptions, ...options } : defaultOptions;

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }}>
          {chartReady && LineComponent ? (
            <LineComponent data={data} options={mergedOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading chart...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
