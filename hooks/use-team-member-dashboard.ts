import useSWR from 'swr';

interface TeamMemberDashboardData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    totalHoursWorked: number;
    averageHoursPerDay: number;
    activeProjects: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
    project: {
      name: string;
      id: string;
    };
    creator: {
      name: string | null;
      email: string;
    };
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    priority: string;
    status: string;
    project: {
      name: string;
      id: string;
    };
  }>;
  userProjects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    client: {
      name: string;
    };
    taskStats: {
      total: number;
      completed: number;
      inProgress: number;
      todo: number;
    };
  }>;
  timeByProject: Record<string, number>;
  recentMessages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: {
      name: string | null;
      email: string;
    };
    receiver: {
      name: string | null;
      email: string;
    };
  }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    fileName: string;
    createdAt: string;
    project: {
      name: string;
      id: string;
    } | null;
    uploadedBy: {
      name: string | null;
      email: string;
    };
  }>;
  weeklyActivity: {
    totalHours: number;
    totalEntries: number;
    averagePerDay: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  const result = await res.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch dashboard data');
  }
  
  return result.data;
};

export function useTeamMemberDashboard() {
  const { data, error, isLoading, mutate } = useSWR<TeamMemberDashboardData>(
    '/api/team-member/dashboard',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    dashboardData: data,
    loading: isLoading,
    error: error?.message || (error ? 'Failed to load dashboard data' : null),
    refresh: mutate,
  };
}