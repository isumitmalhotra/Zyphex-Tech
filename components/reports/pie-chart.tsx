"use client";

import React, { useEffect, useState } from 'react';
// Dynamic imports to prevent SSR issues
import type { ChartOptions } from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ChartJS.register(ArcElement, Tooltip, Legend);

export interface PieChartProps {
  title?: string;
  description?: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  options?: ChartOptions<'pie'>;
  height?: number;
  className?: string;
}

export function PieChart({
  title,
  description,
  data,
  options,
  height = 300,
  className
}: PieChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [PieComponent, setPieComponent] = useState<React.ComponentType<any> | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // Load Chart.js dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    Promise.all([
      import('chart.js'),
      import('react-chartjs-2')
    ]).then(([chartModule, reactChartModule]) => {
      const { Chart: ChartJS, ArcElement, Tooltip, Legend } = chartModule;
      ChartJS.register(ArcElement, Tooltip, Legend);
      setPieComponent(() => reactChartModule.Pie);
      setChartReady(true);
    }).catch(error => {
      console.error('Error loading Chart.js:', error);
    });
  }, []);

  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: false,
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
        <div style={{ height: `${height}px` }} className="flex items-center justify-center">
          {chartReady && PieComponent ? (
            <PieComponent data={data} options={mergedOptions} />
          ) : (
            <div className="text-muted-foreground">Loading chart...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
