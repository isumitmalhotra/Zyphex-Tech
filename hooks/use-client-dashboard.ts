import useSWR from 'swr';

interface ClientDashboardData {
  client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
  };
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    cancelledProjects: number;
    projectCompletionRate: number;
    totalInvestment: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    createdAt: string;
    updatedAt: string;
    progress: number;
    taskStats: {
      total: number;
      completed: number;
      inProgress: number;
      todo: number;
    };
    team: {
      members: Array<{
        user: {
          name: string | null;
          email: string;
        };
      }>;
    };
    documents: Array<{
      id: string;
      title: string;
      fileName: string;
      createdAt: string;
    }>;
  }>;
  upcomingMilestones: Array<{
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
      name: string | null;
      email: string;
    } | null;
  }>;
  recentMessages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: {
      name: string | null;
      email: string;
      role: string;
    };
    receiver: {
      name: string | null;
      email: string;
      role: string;
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
    };
    uploadedBy: {
      name: string | null;
      email: string;
    };
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: string | null;
    createdAt: string;
    project: {
      name: string;
      id: string;
    };
  }>;
  contactHistory: Array<{
    id: string;
    type: string;
    notes: string | null;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}

const fetcher = (url: string) => 
  fetch(url).then((res) => res.json()).then((result) => result.data);

export function useClientDashboard() {
  const { data, error, isLoading, mutate } = useSWR<ClientDashboardData>(
    '/api/client/dashboard',
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