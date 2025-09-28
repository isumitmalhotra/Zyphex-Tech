import useSWR from 'swr';

interface DashboardOverview {
  totalRevenue: number;
  revenueChange: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectCompletionRate: number;
  totalClients: number;
  totalTeamMembers: number;
}

interface RecentProject {
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
  budgetUsed: number | null;
  updatedAt: string;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  user: {
    name: string | null;
    email: string;
  };
  createdAt: string;
}

interface AdminDashboardData {
  overview: DashboardOverview;
  recentProjects: RecentProject[];
  recentActivities: RecentActivity[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((result) => result.data);

export function useAdminDashboard() {
  const { data, error, isLoading, mutate } = useSWR<AdminDashboardData>(
    '/api/admin/dashboard',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}