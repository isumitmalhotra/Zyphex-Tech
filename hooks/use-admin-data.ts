import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  users: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  budgetUsed: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
  website: string | null;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  _count: {
    projects: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AdminTeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  teamMemberships: Array<{
    id: string;
    role: string;
    hourlyRate: number | null;
    project: {
      id: string;
      name: string;
      status: string;
    } | null;
  }>;
  _count: {
    timeEntries: number;
    assignedTasks: number;
  };
  createdAt: string;
}

export function useAdminProjects() {
  const { data, error, isLoading, mutate } = useSWR<{ projects: AdminProject[] }>(
    '/api/admin/projects',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    projects: data?.projects || [],
    error,
    isLoading,
    mutate,
  };
}

export function useAdminClients() {
  const { data, error, isLoading, mutate } = useSWR<{ clients: AdminClient[] }>(
    '/api/admin/clients',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    clients: data?.clients || [],
    error,
    isLoading,
    mutate,
  };
}

export function useAdminTeam() {
  const { data, error, isLoading, mutate } = useSWR<{ teamMembers: AdminTeamMember[] }>(
    '/api/admin/team',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    teamMembers: data?.teamMembers || [],
    error,
    isLoading,
    mutate,
  };
}