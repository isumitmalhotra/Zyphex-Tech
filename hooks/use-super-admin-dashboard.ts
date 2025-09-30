import useSWR from 'swr';

interface SuperAdminDashboardData {
  systemOverview: {
    totalUsers: number;
    totalClients: number;
    totalProjects: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingRevenue: number;
    overdueRevenue: number;
  };
  monthlyStats: {
    newUsers: number;
    newProjects: number;
    newClients: number;
    completedProjects: number;
  };
  usersByRole: Array<{
    role: string;
    _count: {
      id: number;
    };
  }>;
  projectsByStatus: Array<{
    status: string;
    _count: {
      id: number;
    };
  }>;
  teamPerformance: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    totalHours: number;
    totalTasks: number;
    completedTasks: number;
    efficiency: number;
  }>;
  securityMetrics: {
    failedLogins: number;
    adminActions: number;
    permissionChanges: number;
  };
  systemHealth: {
    activeProjects: number;
    overdueTasks: number;
    overdueInvoices: number;
    inactiveUsers: number;
  };
  clientMetrics: {
    totalClients: number;
    activeClients: number;
    newClientsThisMonth: number;
  };
  permissionUsage: Array<{
    action: string;
    _count: {
      id: number;
    };
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
      role: string;
    } | null;
  }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
    emailVerified: string | null;
  }>;
  urgentTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    dueDate: string | null;
    project: {
      name: string;
      id: string;
    };
    assignee: {
      name: string | null;
      email: string;
    } | null;
  }>;
}

const fetcher = (url: string) => 
  fetch(url).then((res) => res.json()).then((result) => result.data);

export function useSuperAdminDashboard() {
  const { data, error, isLoading, mutate } = useSWR<SuperAdminDashboardData>(
    '/api/super-admin/dashboard',
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