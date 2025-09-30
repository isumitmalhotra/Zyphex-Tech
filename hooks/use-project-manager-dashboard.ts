import useSWR from 'swr';

interface ProjectManagerDashboardData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTeamMembers: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    client: {
      name: string;
      email: string;
    };
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    createdAt: string;
    updatedAt: string;
    taskStats: {
      total: number;
      completed: number;
    };
    team: {
      members: Array<{
        user: {
          id: string;
          name: string;
          email: string;
        };
      }>;
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
    assignee: {
      name: string;
      email: string;
    } | null;
  }>;
  teamPerformance: Array<{
    userId: string;
    _sum: {
      duration: number | null;
    };
    _count: {
      id: number;
    };
    user: {
      id: string;
      name: string;
      email: string;
    } | undefined;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string | null;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}

const fetcher = (url: string) => 
  fetch(url).then((res) => res.json()).then((result) => result.data);

export function useProjectManagerDashboard() {
  const { data, error, isLoading, mutate } = useSWR<ProjectManagerDashboardData>(
    '/api/project-manager/dashboard',
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