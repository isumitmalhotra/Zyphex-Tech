"use client";

import React, { useEffect, useState } from 'react';
// Dynamic imports to prevent SSR issues
import type { ChartOptions } from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ChartJS.register(...)

export interface BarChartProps {
  title?: string;
  description?: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  options?: ChartOptions<'bar'>;
  height?: number;
  className?: string;
}

export function BarChart({
  title,
  description,
  data,
  options,
  height = 300,
  className
}: BarChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [BarComponent, setBarComponent] = useState<React.ComponentType<any> | null>(null);
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
        BarElement,
        Title,
        Tooltip,
        Legend
      } = chartModule;
      ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend
      );
      setBarComponent(() => reactChartModule.Bar);
      setChartReady(true);
    }).catch(error => {
      console.error('Error loading Chart.js:', error);
    });
  }, []);

  const defaultOptions: ChartOptions<'bar'> = {
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
          {chartReady && BarComponent ? (
            <BarComponent data={data} options={mergedOptions} />
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
