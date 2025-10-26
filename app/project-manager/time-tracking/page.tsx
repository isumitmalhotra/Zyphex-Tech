"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Play, Pause, Square, Clock, Calendar as CalendarIcon, Plus, Edit, Trash2, Download, Search, TrendingUp, AlertCircle, Check, X, FileText, DollarSign } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

// Types
interface TimeEntry {
  id: string;
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description: string;
  billable: boolean;
  rate?: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  userId: string;
  userName: string;
  date: Date;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: Date | null;
  pausedTime: number;
  currentEntry: Partial<TimeEntry> | null;
}

export default function TimeTrackingPage() {
  // State Management
  const [activeTab, setActiveTab] = useState("timer");
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    currentEntry: null,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterBillable, setFilterBillable] = useState("all");
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; client?: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; name: string; projectId: string }>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data from API
  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/project-manager/time-tracking");
      if (!response.ok) throw new Error("Failed to fetch time entries");
      
      const data = await response.json();
      
      // Transform API data to match component interface
      const transformedEntries: TimeEntry[] = data.entries.map((entry: Record<string, unknown>) => ({
        id: entry.id as string,
        taskId: entry.taskId as string,
        taskName: entry.task ? (entry.task as Record<string, unknown>).name as string : "No Task",
        projectId: entry.projectId as string,
        projectName: entry.project ? (entry.project as Record<string, unknown>).name as string : "No Project",
        startTime: new Date(entry.date as string),
        endTime: entry.date ? new Date(entry.date as string) : undefined,
        duration: ((entry.hours as number) * 3600) || 0, // Convert hours to seconds
        description: entry.description as string || "",
        billable: entry.billable as boolean,
        rate: entry.rate as number || 0,
        status: entry.status as "draft" | "submitted" | "approved" | "rejected",
        userId: entry.userId as string,
        userName: entry.user ? (entry.user as Record<string, unknown>).name as string : "Unknown User",
        date: new Date(entry.date as string),
      }));
      
      setTimeEntries(transformedEntries);
      setFilteredEntries(transformedEntries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/project-manager/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      
      const data = await response.json();
      const transformedProjects = data.projects.map((project: Record<string, unknown>) => ({
        id: project.id as string,
        name: project.name as string,
        client: project.client ? (project.client as Record<string, unknown>).name as string : undefined,
      }));
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/project-manager/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      
      const data = await response.json();
      const transformedTasks = data.tasks.map((task: Record<string, unknown>) => ({
        id: task.id as string,
        name: task.name as string,
        projectId: task.projectId as string,
      }));
      
      setTasks(transformedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, timer.isPaused]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const startTimer = (taskId?: string, projectId?: string) => {
    const now = new Date();
    setTimer({
      isRunning: true,
      isPaused: false,
      startTime: now,
      pausedTime: 0,
      currentEntry: {
        taskId: taskId || "",
        projectId: projectId || "",
        startTime: now,
        description: "",
        billable: true,
      },
    });
    setElapsedSeconds(0);

    // Show notification
    if (Notification.permission === "granted") {
      new Notification("Timer Started", {
        body: "Your time tracking has begun",
        icon: "/favicon.ico",
      });
    }
  };

  const pauseTimer = () => {
    setTimer((prev) => ({ ...prev, isPaused: true, pausedTime: elapsedSeconds }));
  };

  const resumeTimer = () => {
    setTimer((prev) => ({ ...prev, isPaused: false }));
  };

  const stopTimer = () => {
    if (timer.currentEntry && timer.startTime) {
      const newEntry: TimeEntry = {
        id: `entry-${Date.now()}`,
        taskId: timer.currentEntry.taskId || "",
        taskName: tasks.find((t) => t.id === timer.currentEntry?.taskId)?.name || "No Task",
        projectId: timer.currentEntry.projectId || "",
        projectName: projects.find((p) => p.id === timer.currentEntry?.projectId)?.name || "No Project",
        startTime: timer.startTime,
        endTime: new Date(),
        duration: elapsedSeconds,
        description: timer.currentEntry.description || "",
        billable: timer.currentEntry.billable || false,
        status: "draft",
        userId: "user-1",
        userName: "Current User",
        date: new Date(),
      };

      setTimeEntries((prev) => [newEntry, ...prev]);
      setFilteredEntries((prev) => [newEntry, ...prev]);
    }

    setTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      currentEntry: null,
    });
    setElapsedSeconds(0);

    // Show notification
    if (Notification.permission === "granted") {
      new Notification("Timer Stopped", {
        body: `Time logged: ${formatDuration(elapsedSeconds)}`,
        icon: "/favicon.ico",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatHours = (seconds: number): string => {
    return (seconds / 3600).toFixed(2);
  };

  // Filter Logic
  useEffect(() => {
    let filtered = [...timeEntries];

    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterProject !== "all") {
      filtered = filtered.filter((entry) => entry.projectId === filterProject);
    }

    if (filterBillable !== "all") {
      const isBillable = filterBillable === "billable";
      filtered = filtered.filter((entry) => entry.billable === isBillable);
    }

    setFilteredEntries(filtered);
  }, [searchQuery, filterProject, filterBillable, timeEntries]);

  // Manual Time Entry
  const handleAddEntry = async (entryData: Partial<TimeEntry>) => {
    try {
      const payload = {
        taskId: entryData.taskId,
        projectId: entryData.projectId,
        date: entryData.date?.toISOString() || new Date().toISOString(),
        hours: (entryData.duration || 0) / 3600, // Convert seconds to hours
        description: entryData.description || "",
        billable: entryData.billable || false,
        rate: entryData.rate,
        status: "DRAFT",
      };

      if (editingEntry) {
        // Update existing entry
        const response = await fetch("/api/project-manager/time-tracking", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEntry.id, ...payload }),
        });
        
        if (!response.ok) throw new Error("Failed to update time entry");
      } else {
        // Create new entry
        const response = await fetch("/api/project-manager/time-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) throw new Error("Failed to create time entry");
      }

      // Refresh data
      await fetchTimeEntries();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsEntryDialogOpen(false);
      setEditingEntry(null);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const response = await fetch("/api/project-manager/time-tracking", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) throw new Error("Failed to delete time entry");
      
      // Refresh data
      await fetchTimeEntries();
    } catch (error) {
      console.error("Error deleting time entry:", error);
    }
  };

  const handleApproveEntry = async (id: string) => {
    try {
      const entry = timeEntries.find((e) => e.id === id);
      if (!entry) return;

      const response = await fetch("/api/project-manager/time-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status: "APPROVED",
          taskId: entry.taskId,
          projectId: entry.projectId,
          date: entry.date.toISOString(),
          hours: entry.duration / 3600,
          description: entry.description,
          billable: entry.billable,
          rate: entry.rate,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to approve time entry");
      
      // Refresh data
      await fetchTimeEntries();
    } catch (error) {
      console.error("Error approving time entry:", error);
    }
  };

  const handleRejectEntry = async (id: string) => {
    try {
      const entry = timeEntries.find((e) => e.id === id);
      if (!entry) return;

      const response = await fetch("/api/project-manager/time-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status: "REJECTED",
          taskId: entry.taskId,
          projectId: entry.projectId,
          date: entry.date.toISOString(),
          hours: entry.duration / 3600,
          description: entry.description,
          billable: entry.billable,
          rate: entry.rate,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to reject time entry");
      
      // Refresh data
      await fetchTimeEntries();
    } catch (error) {
      console.error("Error rejecting time entry:", error);
    }
  };

  const handleSubmitTimesheet = async () => {
    try {
      // Update all draft entries to submitted status
      const draftEntries = timeEntries.filter((e) => e.status === "draft");
      
      await Promise.all(
        draftEntries.map((entry) =>
          fetch("/api/project-manager/time-tracking", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: entry.id,
              status: "SUBMITTED",
              taskId: entry.taskId,
              projectId: entry.projectId,
              date: entry.date.toISOString(),
              hours: entry.duration / 3600,
              description: entry.description,
              billable: entry.billable,
              rate: entry.rate,
            }),
          })
        )
      );
      
      // Refresh data
      await fetchTimeEntries();
      setIsApprovalDialogOpen(false);
    } catch (error) {
      console.error("Error submitting timesheet:", error);
    }
  };

  // Analytics Calculations
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const billableHours = timeEntries.filter((e) => e.billable).reduce((sum, entry) => sum + entry.duration, 0);
  const nonBillableHours = totalHours - billableHours;
  const totalRevenue = timeEntries
    .filter((e) => e.billable && e.rate)
    .reduce((sum, entry) => sum + (entry.duration / 3600) * (entry.rate || 0), 0);

  const projectTimeData = projects.map((project) => {
    const projectEntries = timeEntries.filter((e) => e.projectId === project.id);
    const hours = projectEntries.reduce((sum, e) => sum + e.duration / 3600, 0);
    return {
      name: project.name,
      hours: parseFloat(hours.toFixed(2)),
      billable: parseFloat(
        projectEntries
          .filter((e) => e.billable)
          .reduce((sum, e) => sum + e.duration / 3600, 0)
          .toFixed(2)
      ),
      nonBillable: parseFloat(
        projectEntries
          .filter((e) => !e.billable)
          .reduce((sum, e) => sum + e.duration / 3600, 0)
          .toFixed(2)
      ),
    };
  });

  const billabilityData = [
    { name: "Billable", value: billableHours / 3600, color: "#10b981" },
    { name: "Non-Billable", value: nonBillableHours / 3600, color: "#6b7280" },
  ];

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startOfWeek(new Date()), i);
    const dayEntries = timeEntries.filter((e) => isSameDay(e.date, date));
    const hours = dayEntries.reduce((sum, e) => sum + e.duration / 3600, 0);
    return {
      day: format(date, "EEE"),
      hours: parseFloat(hours.toFixed(2)),
    };
  });

  // Get unique team members from time entries
  const teamData = Array.from(
    new Map(timeEntries.map(entry => [entry.userId, { id: entry.userId, name: entry.userName }]))
      .values()
  ).map((member) => {
    const memberEntries = timeEntries.filter((e) => e.userId === member.id);
    const hours = memberEntries.reduce((sum, e) => sum + e.duration / 3600, 0);
    return {
      name: member.name,
      hours: parseFloat(hours.toFixed(2)),
      tasks: memberEntries.length,
    };
  });

  // Export functionality
  const exportToCSV = () => {
    const headers = ["Date", "Project", "Task", "Start Time", "End Time", "Duration (hours)", "Description", "Billable", "Rate", "Total", "Status"];
    const rows = filteredEntries.map((entry) => [
      format(entry.date, "yyyy-MM-dd"),
      entry.projectName,
      entry.taskName,
      format(entry.startTime, "HH:mm"),
      entry.endTime ? format(entry.endTime, "HH:mm") : "",
      formatHours(entry.duration),
      entry.description,
      entry.billable ? "Yes" : "No",
      entry.rate || "",
      entry.billable && entry.rate ? ((entry.duration / 3600) * entry.rate).toFixed(2) : "",
      entry.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">Track time, manage timesheets, and analyze productivity</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEntry(null)} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Time Entry
              </Button>
            </DialogTrigger>
            <ManualEntryDialog onSubmit={handleAddEntry} editingEntry={editingEntry} projects={projects} tasks={tasks} />
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 animate-spin text-blue-600" />
            <p className="text-muted-foreground">Loading time tracking data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(totalHours)}h</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatHours(billableHours)}h</div>
            <p className="text-xs text-muted-foreground">{((billableHours / totalHours) * 100 || 0).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Billable Hours</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{formatHours(nonBillableHours)}h</div>
            <p className="text-xs text-muted-foreground">{((nonBillableHours / totalHours) * 100 || 0).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From billable hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Timer Tab */}
        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracker</CardTitle>
              <CardDescription>Start tracking time for your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer Display */}
              <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                <div className="text-6xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-4">{formatDuration(elapsedSeconds)}</div>
                <div className="flex gap-3">
                  {!timer.isRunning ? (
                    <Button size="lg" onClick={() => startTimer()} className="bg-green-600 hover:bg-green-700">
                      <Play className="mr-2 h-5 w-5" />
                      Start Timer
                    </Button>
                  ) : (
                    <>
                      {timer.isPaused ? (
                        <Button size="lg" onClick={resumeTimer} className="bg-blue-600 hover:bg-blue-700">
                          <Play className="mr-2 h-5 w-5" />
                          Resume
                        </Button>
                      ) : (
                        <Button size="lg" onClick={pauseTimer} variant="outline">
                          <Pause className="mr-2 h-5 w-5" />
                          Pause
                        </Button>
                      )}
                      <Button size="lg" onClick={stopTimer} variant="destructive">
                        <Square className="mr-2 h-5 w-5" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Start Options */}
              {!timer.isRunning && (
                <div className="space-y-3">
                  <Label>Quick Start</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {tasks.slice(0, 4).map((task) => (
                      <Button key={task.id} variant="outline" className="justify-start" onClick={() => startTimer(task.id, task.projectId)}>
                        <Play className="mr-2 h-4 w-4" />
                        {task.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Timer Details */}
              {timer.isRunning && timer.currentEntry && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Project</Label>
                      <Select
                        value={timer.currentEntry.projectId}
                        onValueChange={(value) =>
                          setTimer((prev) => ({
                            ...prev,
                            currentEntry: prev.currentEntry ? { ...prev.currentEntry, projectId: value } : null,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Task</Label>
                      <Select
                        value={timer.currentEntry.taskId}
                        onValueChange={(value) =>
                          setTimer((prev) => ({
                            ...prev,
                            currentEntry: prev.currentEntry ? { ...prev.currentEntry, taskId: value } : null,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks
                            .filter((task) => task.projectId === timer.currentEntry?.projectId)
                            .map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What are you working on?"
                      value={timer.currentEntry.description}
                      onChange={(e) =>
                        setTimer((prev) => ({
                          ...prev,
                          currentEntry: prev.currentEntry ? { ...prev.currentEntry, description: e.target.value } : null,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="billable"
                      checked={timer.currentEntry.billable}
                      onChange={(e) =>
                        setTimer((prev) => ({
                          ...prev,
                          currentEntry: prev.currentEntry ? { ...prev.currentEntry, billable: e.target.checked } : null,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="billable">Billable</Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Time Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
              <CardDescription>Your latest tracked time</CardDescription>
            </CardHeader>
            <CardContent>
              <TimeEntriesList
                entries={filteredEntries.slice(0, 5)}
                onEdit={(entry) => {
                  setEditingEntry(entry);
                  setIsEntryDialogOpen(true);
                }}
                onDelete={handleDeleteEntry}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheet Tab */}
        <TabsContent value="timesheet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Timesheet</CardTitle>
                  <CardDescription>Manage your weekly/monthly timesheets</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={viewMode} onValueChange={(value: "week" | "month") => setViewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setIsApprovalDialogOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit for Approval
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search entries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterBillable} onValueChange={setFilterBillable}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="billable">Billable Only</SelectItem>
                    <SelectItem value="non-billable">Non-Billable Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Calendar View */}
              <TimesheetCalendar entries={filteredEntries} selectedDate={selectedDate} onSelectDate={setSelectedDate} viewMode={viewMode} />

              {/* Entries List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Entries for {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                <TimeEntriesList
                  entries={filteredEntries.filter((e) => isSameDay(e.date, selectedDate))}
                  onEdit={(entry) => {
                    setEditingEntry(entry);
                    setIsEntryDialogOpen(true);
                  }}
                  onDelete={handleDeleteEntry}
                  onApprove={handleApproveEntry}
                  onReject={handleRejectEntry}
                  showActions
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Time by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
                <CardDescription>Hours logged per project</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="billable" fill="#10b981" name="Billable" />
                    <Bar dataKey="nonBillable" fill="#6b7280" name="Non-Billable" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Billable vs Non-Billable */}
            <Card>
              <CardHeader>
                <CardTitle>Billability Ratio</CardTitle>
                <CardDescription>Distribution of billable hours</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={billabilityData} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false} 
                      label={(props: Record<string, unknown>) => {
                        const name = props.name as string;
                        const value = props.value as number;
                        return `${name}: ${value.toFixed(1)}h`;
                      }} 
                      outerRadius={100} 
                      fill="#8884d8" 
                      dataKey="value"
                    >
                      {billabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Time Trends</CardTitle>
                <CardDescription>Hours logged each day this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} name="Hours" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Project Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
                <CardDescription>Detailed breakdown by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectTimeData.map((project) => (
                    <div key={project.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.billable.toFixed(1)}h billable, {project.nonBillable.toFixed(1)}h non-billable
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{project.hours.toFixed(1)}h</div>
                        <Badge variant={project.billable > project.nonBillable ? "default" : "secondary"}>
                          {((project.billable / project.hours) * 100 || 0).toFixed(0)}% billable
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Time Overview</CardTitle>
              <CardDescription>View and compare team member productivity</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Team Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#8b5cf6" name="Hours Logged" />
                </BarChart>
              </ResponsiveContainer>

              {/* Team Members List */}
              <div className="mt-6 space-y-3">
                {teamData.map((member) => (
                  <div key={member.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.tasks} tasks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{member.hours.toFixed(1)}h</div>
                      <div className="text-sm text-muted-foreground">this week</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Timesheet for Approval</DialogTitle>
            <DialogDescription>Review and submit your timesheet entries for approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Hours:</div>
                <div className="font-semibold">{formatHours(totalHours)}</div>
                <div>Billable Hours:</div>
                <div className="font-semibold text-green-600">{formatHours(billableHours)}</div>
                <div>Draft Entries:</div>
                <div className="font-semibold">{timeEntries.filter((e) => e.status === "draft").length}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Once submitted, your timesheet will be sent for approval. You won&apos;t be able to edit these entries until they are approved or rejected.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTimesheet}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component: Manual Entry Dialog
function ManualEntryDialog({
  onSubmit,
  editingEntry,
  projects,
  tasks,
}: {
  onSubmit: (data: Partial<TimeEntry>) => void;
  editingEntry: TimeEntry | null;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; name: string; projectId: string }>;
}) {
  const [formData, setFormData] = useState<Partial<TimeEntry>>({
    projectId: editingEntry?.projectId || "",
    taskId: editingEntry?.taskId || "",
    startTime: editingEntry?.startTime || new Date(),
    endTime: editingEntry?.endTime || new Date(),
    description: editingEntry?.description || "",
    billable: editingEntry?.billable || true,
    rate: editingEntry?.rate || 75,
    date: editingEntry?.date || new Date(),
  });

  const handleSubmit = () => {
    const start = formData.startTime || new Date();
    const end = formData.endTime || new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    onSubmit({
      ...formData,
      duration,
    });
  };

  const filteredTasks = tasks.filter((task) => task.projectId === formData.projectId);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{editingEntry ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
        <DialogDescription>Log time manually for a specific task</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project *</Label>
          <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value, taskId: "" })}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Task *</Label>
          <Select value={formData.taskId} onValueChange={(value) => setFormData({ ...formData, taskId: value })} disabled={!formData.projectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select task" />
            </SelectTrigger>
            <SelectContent>
              {filteredTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.date} onSelect={(date) => setFormData({ ...formData, date: date || new Date() })} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Start Time *</Label>
          <Input
            type="time"
            value={formData.startTime ? format(formData.startTime, "HH:mm") : ""}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":").map(Number);
              const newStart = new Date(formData.date || new Date());
              newStart.setHours(hours, minutes, 0, 0);
              setFormData({ ...formData, startTime: newStart });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>End Time *</Label>
          <Input
            type="time"
            value={formData.endTime ? format(formData.endTime, "HH:mm") : ""}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":").map(Number);
              const newEnd = new Date(formData.date || new Date());
              newEnd.setHours(hours, minutes, 0, 0);
              setFormData({ ...formData, endTime: newEnd });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Hourly Rate ($)</Label>
          <Input type="number" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })} />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Description</Label>
          <Textarea placeholder="What did you work on?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <input type="checkbox" id="manual-billable" checked={formData.billable} onChange={(e) => setFormData({ ...formData, billable: e.target.checked })} className="rounded border-gray-300" />
          <Label htmlFor="manual-billable">Billable</Label>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>{editingEntry ? "Update Entry" : "Add Entry"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Component: Time Entries List
function TimeEntriesList({
  entries,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  showActions = false,
}: {
  entries: TimeEntry[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No time entries found</p>
      </div>
    );
  }

  const formatHours = (seconds: number): string => {
    return (seconds / 3600).toFixed(2);
  };

  const getStatusBadge = (status: TimeEntry["status"]) => {
    const variants: Record<TimeEntry["status"], { variant: "secondary" | "default" | "destructive"; label: string; className?: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      submitted: { variant: "default", label: "Submitted" },
      approved: { variant: "default", label: "Approved", className: "bg-green-600" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className || ""}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{entry.taskName}</h4>
                <Badge variant={entry.billable ? "default" : "secondary"}>{entry.billable ? "Billable" : "Non-Billable"}</Badge>
                {getStatusBadge(entry.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{entry.projectName}</p>
              {entry.description && <p className="text-sm mb-2">{entry.description}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatHours(entry.duration)}h
                </span>
                <span>
                  {format(entry.startTime, "HH:mm")} - {entry.endTime ? format(entry.endTime, "HH:mm") : "Running"}
                </span>
                {entry.billable && entry.rate && <span>${((entry.duration / 3600) * entry.rate).toFixed(2)}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              {showActions && entry.status === "submitted" && onApprove && onReject && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => onApprove(entry.id)} title="Approve">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onReject(entry.id)} title="Reject">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              )}
              {entry.status === "draft" && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(entry)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component: Timesheet Calendar
function TimesheetCalendar({
  entries,
  selectedDate,
  onSelectDate,
  viewMode,
}: {
  entries: TimeEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  viewMode: "week" | "month";
}) {
  const startDate = viewMode === "week" ? startOfWeek(selectedDate) : startOfMonth(selectedDate);
  const endDate = viewMode === "week" ? endOfWeek(selectedDate) : endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayEntries = (date: Date) => {
    return entries.filter((e) => isSameDay(e.date, date));
  };

  const getDayHours = (date: Date) => {
    const dayEntries = getDayEntries(date);
    return dayEntries.reduce((sum, e) => sum + e.duration, 0) / 3600;
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
          {day}
        </div>
      ))}
      {days.map((day) => {
        const dayEntries = getDayEntries(day);
        const hours = getDayHours(day);
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentDay = isToday(day);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "border rounded-lg p-3 text-left hover:border-blue-400 transition-colors min-h-[80px]",
              isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-950",
              isCurrentDay && "border-blue-300",
              hours === 0 && "opacity-50"
            )}
          >
            <div className={cn("text-sm font-semibold mb-1", isCurrentDay && "text-blue-600")}>{format(day, "d")}</div>
            {hours > 0 && (
              <div className="text-xs space-y-1">
                <div className="font-medium">{hours.toFixed(1)}h</div>
                <div className="text-muted-foreground">{dayEntries.length} entries</div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}