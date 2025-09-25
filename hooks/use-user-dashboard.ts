import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface UserDashboardData {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role: string
  }
  stats: {
    activeProjects: number
    completedProjects: number
    messages: number
    nextMeeting: string | null
  }
  projects: Array<{
    id: string
    name: string
    description?: string | null
    status: string
    client: string
    startDate?: string | null
    endDate?: string | null
    createdAt: string
    updatedAt: string
    progress: number
    priority: string
  }>
  recentActivity: Array<{
    type: string
    title: string
    time: string
    icon: string
    color: string
  }>
}

export function useUserDashboard() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      setLoading(false)
      setError('Not authenticated')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/user/dashboard')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
        }

        const data = await response.json()
        setDashboardData(data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session, status])

  const refetch = async () => {
    if (!session?.user) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/dashboard')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      console.error('Error refetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return {
    dashboardData,
    loading,
    error,
    refetch
  }
}