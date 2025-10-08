"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Plus,
  User,
  Video,
  Phone,
  MapPin,
  Loader2,
  CalendarDays,
} from "lucide-react"
import { toast } from "sonner"

interface Appointment {
  id: string
  title: string
  description: string
  date: string
  time: string
  type: string
  status: string
  with: string
  createdAt: string
  duration?: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "meeting",
    duration: "30"
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/appointments")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      } else {
        toast.error("Failed to load appointments")
      }
    } catch (error) {
      toast.error("Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  const scheduleAppointment = async () => {
    if (!newAppointment.title.trim() || !newAppointment.date || !newAppointment.time) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setScheduling(true)
      
      const response = await fetch("/api/user/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppointment)
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success("Appointment scheduled successfully!")
        setNewAppointment({
          title: "",
          description: "",
          date: "",
          time: "",
          type: "meeting",
          duration: "30"
        })
        fetchAppointments() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to schedule appointment")
      }
      
    } catch (error) {
      toast.error("Failed to schedule appointment")
    } finally {
      setScheduling(false)
    }
  }

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case "video_call":
        return <Video className="h-4 w-4" />
      case "phone_call":
        return <Phone className="h-4 w-4" />
      case "in_person":
        return <MapPin className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300"
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300"
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Schedule meetings and consultations with the ZyphexTech team
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="zyphex-button">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Book a meeting with the ZyphexTech team to discuss your project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Meeting Title *</label>
                <Input
                  placeholder="e.g., Project Discussion"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of what you would like to discuss..."
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time *</label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meeting Type</label>
                  <Select
                    value={newAppointment.type}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">General Meeting</SelectItem>
                      <SelectItem value="video_call">Video Call</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <Select
                    value={newAppointment.duration}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={scheduleAppointment} 
                disabled={scheduling || !newAppointment.title.trim() || !newAppointment.date || !newAppointment.time}
                className="w-full zyphex-button"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {appointments.length === 0 ? (
        <Card className="zyphex-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No appointments scheduled</h3>
            <p className="text-muted-foreground text-center mb-4">
              Schedule your first meeting with the ZyphexTech team to discuss your project needs.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="zyphex-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule First Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                  <DialogDescription>
                    Book a meeting with the ZyphexTech team to discuss your project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Title *</label>
                    <Input
                      placeholder="e.g., Project Discussion"
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Brief description of what you would like to discuss..."
                      value={newAppointment.description}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time *</label>
                      <Input
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Meeting Type</label>
                      <Select
                        value={newAppointment.type}
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">General Meeting</SelectItem>
                          <SelectItem value="video_call">Video Call</SelectItem>
                          <SelectItem value="phone_call">Phone Call</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration</label>
                      <Select
                        value={newAppointment.duration}
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, duration: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={scheduleAppointment} 
                    disabled={scheduling || !newAppointment.title.trim() || !newAppointment.date || !newAppointment.time}
                    className="w-full zyphex-button"
                  >
                    {scheduling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Schedule Appointment
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="zyphex-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getAppointmentTypeIcon(appointment.type)}
                      <CardTitle className="text-lg">{appointment.title}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                  {appointment.description && (
                    <CardDescription>{appointment.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(appointment.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {appointment.time} ({appointment.duration} min)
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    {appointment.type.replace("_", " ").charAt(0).toUpperCase() + appointment.type.replace("_", " ").slice(1)}
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
