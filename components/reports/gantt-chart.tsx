"use client";

import React, { useEffect, useRef, useState } from 'react';
import Gantt from 'frappe-gantt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import 'frappe-gantt/dist/frappe-gantt.css';

export interface GanttTask {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  progress: number; // 0-100
  dependencies?: string; // Comma-separated task IDs
  custom_class?: string;
}

export interface GanttChartProps {
  title?: string;
  description?: string;
  tasks: GanttTask[];
  viewMode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
  onClick?: (task: GanttTask) => void;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  className?: string;
}

export function GanttChart({
  title,
  description,
  tasks,
  viewMode = 'Day',
  onClick,
  onDateChange,
  onProgressChange,
  className
}: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<Gantt | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !ganttRef.current || tasks.length === 0) return;

    const currentRef = ganttRef.current;

    try {
      // Destroy existing instance
      if (ganttInstance.current) {
        // Frappe Gantt doesn't have a destroy method, so we clear the container
        currentRef.innerHTML = '';
      }

      // Create new instance
      ganttInstance.current = new Gantt(currentRef, tasks, {
        view_mode: viewMode,
        on_click: (task: GanttTask) => {
          if (onClick) onClick(task);
        },
        on_date_change: (task: GanttTask, start: Date, end: Date) => {
          if (onDateChange) onDateChange(task, start, end);
        },
        on_progress_change: (task: GanttTask, progress: number) => {
          if (onProgressChange) onProgressChange(task, progress);
        },
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        language: 'en',
      });
    } catch (error) {
      console.error('Error initializing Gantt chart:', error);
    }

    return () => {
      if (currentRef) {
        currentRef.innerHTML = '';
      }
    };
  }, [tasks, viewMode, onClick, onDateChange, onProgressChange, mounted]);

  if (!mounted) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Loading Gantt chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            No tasks to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div ref={ganttRef} className="overflow-x-auto" />
      </CardContent>
    </Card>
  );
}
