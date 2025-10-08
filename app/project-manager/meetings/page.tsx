"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, addDays, startOfDay, endOfDay } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  Plus, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  X,
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SubtleBackground } from "@/components/subtle-background"

interface Meeting {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  type: 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE_CALL' | 'CONFERENCE'
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS' | 'RESCHEDULED' | 'NO_SHOW'
  location?: string
  organizer: {
    id: string
    name: string
    email: string
    image?: string
  }
  attendees: Array<{
    id: string
    status: string
    user?: {
      id: string
      name: string
      email: string
      image?: string
    }
    client?: {
      id: string
      name: string
      email: string
    }
  }>
  project?: {
    id: string
    name: string
  }
  actionItems?: Array<{
    id: string
    title: string
    completed: boolean
  }>
}

interface MeetingFormData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  type: string
  location: string
  attendees: string[]
}

export default function MeetingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [formData, setFormData] = useState<MeetingFormData>({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    type: "VIDEO_CALL",
    location: "",
    attendees: [],
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "PROJECT_MANAGER" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
    } else if (status === "authenticated") {
      fetchMeetings()
    }
  }, [status, session, router])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/meetings")
      
      if (!response.ok) throw new Error("Failed to fetch meetings")
      
      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (error) {
      console.error("Error fetching meetings:", error)
      toast.error("Failed to load meetings")
    } finally {
      setLoading(false)
    }
  }

  const createMeeting = async () => {
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)
      const duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          duration,
          type: formData.type,
          location: formData.location || undefined,
          attendees: [
            { userId: session?.user?.id, isRequired: true }
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create meeting")
      }

      toast.success("Meeting created successfully")
      setIsCreateDialogOpen(false)
      resetForm()
      fetchMeetings()
    } catch (error: any) {
      console.error("Error creating meeting:", error)
      toast.error(error.message || "Failed to create meeting")
    }
  }

  const deleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to cancel meeting")

      toast.success("Meeting cancelled successfully")
      fetchMeetings()
      setIsDetailsDialogOpen(false)
    } catch (error) {
      console.error("Error cancelling meeting:", error)
      toast.error("Failed to cancel meeting")
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      type: "VIDEO_CALL",
      location: "",
      attendees: [],
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500'
      case 'COMPLETED': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'RESCHEDULED': return 'bg-orange-500'
      case 'NO_SHOW': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO_CALL': return <Video className="h-4 w-4" />
      case 'PHONE_CALL': return <Phone className="h-4 w-4" />
      case 'IN_PERSON': return <MapPin className="h-4 w-4" />
      case 'CONFERENCE': return <Users className="h-4 w-4" />
      default: return <CalendarIcon className="h-4 w-4" />
    }
  }

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = searchQuery === "" || 
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter
    const matchesType = typeFilter === "all" || meeting.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Get meetings for current view
  const getViewMeetings = () => {
    let startDate: Date
    let endDate: Date

    switch (view) {
      case 'month':
        startDate = startOfMonth(currentDate)
        endDate = endOfMonth(currentDate)
        break
      case 'week':
        startDate = startOfWeek(currentDate)
        endDate = endOfWeek(currentDate)
        break
      case 'day':
        startDate = startOfDay(currentDate)
        endDate = endOfDay(currentDate)
        break
      default:
        return filteredMeetings
    }

    return filteredMeetings.filter(meeting => {
      const meetingDate = parseISO(meeting.startTime)
      return meetingDate >= startDate && meetingDate <= endDate
    })
  }

  const viewMeetings = getViewMeetings()

  // Calculate stats
  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m => m.status === 'SCHEDULED' && new Date(m.startTime) > new Date()).length,
    today: meetings.filter(m => isSameDay(parseISO(m.startTime), new Date())).length,
    thisWeek: meetings.filter(m => {
      const meetingDate = parseISO(m.startTime)
      return meetingDate >= startOfWeek(new Date()) && meetingDate <= endOfWeek(new Date())
    }).length,
  }

  // Render calendar view
  const renderCalendarView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold zyphex-heading p-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayMeetings = viewMeetings.filter(m => isSameDay(parseISO(m.startTime), day))
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 rounded-lg border ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/30'
              } ${
                isToday(day) ? 'border-primary' : 'border-border'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday(day) ? 'text-primary font-bold' : 'zyphex-heading'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayMeetings.slice(0, 2).map(meeting => (
                  <div
                    key={meeting.id}
                    className="text-xs p-1 rounded cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      setIsDetailsDialogOpen(true)
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full inline-block mr-1 ${getStatusColor(meeting.status)}`} />
                    <span className="zyphex-heading truncate">{meeting.title}</span>
                  </div>
                ))}
                {dayMeetings.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayMeetings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render list view
  const renderListView = () => {
    if (viewMeetings.length === 0) {
      return (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium zyphex-heading mb-2">No meetings found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first meeting to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="zyphex-button">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      )
    }

    const groupedMeetings = viewMeetings.reduce((acc, meeting) => {
      const date = format(parseISO(meeting.startTime), 'yyyy-MM-dd')
      if (!acc[date]) acc[date] = []
      acc[date].push(meeting)
      return acc
    }, {} as Record<string, Meeting[]>)

    return (
      <div className="space-y-6">
        {Object.entries(groupedMeetings).map(([date, meetings]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold zyphex-heading mb-3">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {meetings.map(meeting => (
                <Card 
                  key={meeting.id} 
                  className="zyphex-card cursor-pointer hover-zyphex-glow transition-all"
                  onClick={() => {
                    setSelectedMeeting(meeting)
                    setIsDetailsDialogOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(meeting.status)}`} />
                          <h4 className="font-semibold zyphex-heading">{meeting.title}</h4>
                          <Badge variant="outline" className="ml-auto">
                            <div className="flex items-center gap-1">
                              {getTypeIcon(meeting.type)}
                              <span className="text-xs">{meeting.type.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(meeting.startTime), 'h:mm a')} - {format(parseISO(meeting.endTime), 'h:mm a')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {meeting.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {meeting.description}
                          </p>
                        )}

                        {meeting.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                            <MapPin className="h-3 w-3" />
                            {meeting.location}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={meeting.organizer.image} />
                          <AvatarFallback>{meeting.organizer.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <SubtleBackground />
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 bg-background/80 backdrop-blur-sm px-4 border-b">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/project-manager">Project Manager</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Meetings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Meetings</h1>
            <p className="text-muted-foreground mt-2">
              Schedule and manage team meetings
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="zyphex-button">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium zyphex-subheading">Total Meetings</p>
                  <p className="text-3xl font-bold zyphex-heading mt-2">{stats.total}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium zyphex-subheading">Upcoming</p>
                  <p className="text-3xl font-bold zyphex-heading mt-2">{stats.upcoming}</p>
                </div>
                <Clock className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium zyphex-subheading">Today</p>
                  <p className="text-3xl font-bold zyphex-heading mt-2">{stats.today}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium zyphex-subheading">This Week</p>
                  <p className="text-3xl font-bold zyphex-heading mt-2">{stats.thisWeek}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search meetings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                  <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                  <SelectItem value="IN_PERSON">In Person</SelectItem>
                  <SelectItem value="CONFERENCE">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calendar/List View */}
        <Card className="zyphex-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
                    else if (view === 'week') setCurrentDate(addDays(currentDate, -7))
                    else setCurrentDate(addDays(currentDate, -1))
                  }}
                  className="zyphex-button-secondary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="min-w-[200px] text-center">
                  <h3 className="text-lg font-semibold zyphex-heading">
                    {view === 'month' && format(currentDate, 'MMMM yyyy')}
                    {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
                    {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                    {view === 'list' && 'All Meetings'}
                  </h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
                    else if (view === 'week') setCurrentDate(addDays(currentDate, 7))
                    else setCurrentDate(addDays(currentDate, 1))
                  }}
                  className="zyphex-button-secondary"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="zyphex-button-secondary"
                >
                  Today
                </Button>
              </div>

              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            {view === 'month' ? renderCalendarView() : renderListView()}
          </CardContent>
        </Card>

        {/* Create Meeting Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Create a new meeting and invite attendees
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Project Kickoff Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Meeting agenda and notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Meeting Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO_CALL">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video Call
                        </div>
                      </SelectItem>
                      <SelectItem value="PHONE_CALL">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Call
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_PERSON">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          In Person
                        </div>
                      </SelectItem>
                      <SelectItem value="CONFERENCE">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Conference
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location / Meeting Link</Label>
                  <Input
                    id="location"
                    placeholder="Enter location or URL"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={createMeeting}
                disabled={!formData.title || !formData.date || !formData.startTime || !formData.endTime}
                className="zyphex-button"
              >
                Schedule Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Meeting Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            {selectedMeeting && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-2xl">{selectedMeeting.title}</DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getStatusColor(selectedMeeting.status)} text-white`}>
                          {selectedMeeting.status}
                        </Badge>
                        <Badge variant="outline">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(selectedMeeting.type)}
                            {selectedMeeting.type.replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMeeting(selectedMeeting.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {selectedMeeting.description && (
                    <div>
                      <h4 className="text-sm font-semibold zyphex-heading mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedMeeting.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold zyphex-heading mb-2">Date & Time</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        {format(parseISO(selectedMeeting.startTime), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        {format(parseISO(selectedMeeting.startTime), 'h:mm a')} - {format(parseISO(selectedMeeting.endTime), 'h:mm a')}
                        <span className="text-xs">({selectedMeeting.duration} min)</span>
                      </div>
                    </div>

                    {selectedMeeting.location && (
                      <div>
                        <h4 className="text-sm font-semibold zyphex-heading mb-2">Location</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {selectedMeeting.location}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold zyphex-heading mb-2">Organizer</h4>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={selectedMeeting.organizer.image} />
                        <AvatarFallback>{selectedMeeting.organizer.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium zyphex-heading">{selectedMeeting.organizer.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedMeeting.organizer.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold zyphex-heading mb-2">
                      Attendees ({selectedMeeting.attendees.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedMeeting.attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={attendee.user?.image} />
                              <AvatarFallback>
                                {(attendee.user?.name || attendee.client?.name)?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium zyphex-heading">
                                {attendee.user?.name || attendee.client?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attendee.user?.email || attendee.client?.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {attendee.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold zyphex-heading mb-2">Action Items</h4>
                      <div className="space-y-2">
                        {selectedMeeting.actionItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button className="zyphex-button">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Meeting
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
