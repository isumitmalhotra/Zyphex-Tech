"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  Play,
  Pause,
  Square,
  Calendar,
  Timer,
  BarChart3,
  Download,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"

// Mock data for time entries
const timeEntries = [
  {
    id: "1",
    date: "2025-09-30",
    project: "E-commerce Platform",
    task: "Implement user authentication",
    hours: 3.5,
    description: "Set up NextAuth.js configuration and testing",
    billable: true,
    status: "APPROVED",
  },
  {
    id: "2", 
    date: "2025-09-30",
    project: "Mobile App Development",
    task: "Fix mobile responsiveness",
    hours: 2.0,
    description: "Resolved layout issues on iPhone and Android",
    billable: true,
    status: "SUBMITTED",
  },
  {
    id: "3",
    date: "2025-09-29",
    project: "E-commerce Platform", 
    task: "Design product catalog UI",
    hours: 4.0,
    description: "Created responsive product grid components",
    billable: true,
    status: "APPROVED",
  },
  {
    id: "4",
    date: "2025-09-29",
    project: "Data Analytics Dashboard",
    task: "Write unit tests",
    hours: 1.5,
    description: "Added test coverage for authentication module",
    billable: false,
    status: "DRAFT",
  }
]

const statusColors = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500", 
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
}

export default function TimeTrackingPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentTime] = useState(0)
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedTask, setSelectedTask] = useState("")
  const [description, setDescription] = useState("")

  // Calculate totals
  const todayEntries = timeEntries.filter(entry => entry.date === "2025-09-30")
  const todayHours = todayEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const weekHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billableHours = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0)

  const toggleTimer = () => {
    setIsTracking(!isTracking)
    if (!isTracking) {
      // Start timer logic would go here
    } else {
      // Stop timer and save entry logic would go here
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your work hours and manage time entries
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Time Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-900/20 border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{todayHours}h</div>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{weekHours}h</div>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{billableHours}h</div>
                <p className="text-xs text-muted-foreground">Billable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round((billableHours / weekHours) * 100) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Billable Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Widget */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Time Tracker</CardTitle>
          <CardDescription>Start tracking time for your current task</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecommerce">E-commerce Platform</SelectItem>
                  <SelectItem value="mobile">Mobile App Development</SelectItem>
                  <SelectItem value="analytics">Data Analytics Dashboard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select Task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auth">Implement user authentication</SelectItem>
                  <SelectItem value="ui">Design product catalog UI</SelectItem>
                  <SelectItem value="mobile">Fix mobile responsiveness</SelectItem>
                  <SelectItem value="tests">Write unit tests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-600"
            />
            <div className="flex items-center justify-between">
              <div className="text-4xl font-mono font-bold text-white">
                {formatTime(currentTime)}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={toggleTimer}
                  className={isTracking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {isTracking ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button variant="outline" className="border-gray-600">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Time Entries</CardTitle>
              <CardDescription>Your logged work hours</CardDescription>
            </div>
            <Button variant="outline" className="border-gray-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Project</TableHead>
                <TableHead className="text-gray-300">Task</TableHead>
                <TableHead className="text-gray-300">Hours</TableHead>
                <TableHead className="text-gray-300">Billable</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow key={entry.id} className="border-gray-700">
                  <TableCell>
                    <span className="text-gray-300">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-400">{entry.project}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-white font-medium">{entry.task}</div>
                      <div className="text-sm text-muted-foreground">{entry.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-white font-medium">{entry.hours}h</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={entry.billable ? "default" : "secondary"}
                      className={entry.billable ? "bg-green-600" : "bg-gray-600"}
                    >
                      {entry.billable ? "Billable" : "Non-billable"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={`${statusColors[entry.status as keyof typeof statusColors]} text-white`}
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}