import { useState, useEffect } from 'react'

interface SidebarCounts {
  notifications: number
  messages: number
  projects: number
  appointments: number
}

export function useSidebarCounts() {
  const [counts, setCounts] = useState<SidebarCounts>({
    notifications: 0,
    messages: 0,
    projects: 0,
    appointments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchCounts = async () => {
    try {
      setIsLoading(true)
      
      // Fetch data from all relevant APIs
      const [notificationsRes, projectsRes, appointmentsRes, messagesRes] = await Promise.all([
        fetch('/api/user/notifications').catch(() => null),
        fetch('/api/user/projects').catch(() => null),
        fetch('/api/user/appointments').catch(() => null),
        fetch('/api/user/messages').catch(() => null)
      ])

      let notificationCount = 0
      let projectCount = 0
      let upcomingAppointments = 0
      let messageCount = 0

      // Process notifications
      if (notificationsRes?.ok) {
        const notificationsData = await notificationsRes.json()
        notificationCount = notificationsData.notifications?.filter((n: { read: boolean }) => !n.read).length || 0
      }

      // Process projects
      if (projectsRes?.ok) {
        const projectsData = await projectsRes.json()
        const projects = Array.isArray(projectsData) ? projectsData : []
        projectCount = projects.filter((p: { status: string }) => 
          p.status === 'IN_PROGRESS' || p.status === 'in-progress'
        ).length
      }

      // Process appointments
      if (appointmentsRes?.ok) {
        const appointmentsData = await appointmentsRes.json()
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        upcomingAppointments = appointmentsData.appointments?.filter((a: { date: string }) => {
          const appointmentDate = new Date(a.date)
          return appointmentDate >= now && appointmentDate <= nextWeek
        }).length || 0
      }

      // Process messages
      if (messagesRes?.ok) {
        const messagesData = await messagesRes.json()
        messageCount = messagesData.unreadCount || 0
      }

      setCounts({
        notifications: notificationCount,
        messages: messageCount,
        projects: projectCount,
        appointments: upcomingAppointments
      })
    } catch (error) {
      console.error('Error fetching sidebar counts:', error)
      // Set to 0 on error
      setCounts({
        notifications: 0,
        messages: 0,
        projects: 0,
        appointments: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
    
    // Refresh counts every 30 seconds for real-time updates
    const interval = setInterval(fetchCounts, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Function to manually refresh counts
  const refreshCounts = () => {
    fetchCounts()
  }

  return {
    counts,
    isLoading,
    refreshCounts
  }
}