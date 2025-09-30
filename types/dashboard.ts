// Type definition file for API responses
// This will provide better type safety across the dashboard system

export interface DatabaseProject {
  id: string;
  name: string;
  status: string;
  tasks: Array<{
    id: string;
    status: string;
    title: string;
    dueDate?: string;
  }>;
  documents?: Array<{
    id: string;
    title: string;
  }>;
}

export interface DatabaseUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface DatabaseTimeEntry {
  duration: number;
  task: {
    project: {
      name: string;
    };
  };
}

export interface DatabaseTeamPerformance {
  userId: string;
  _sum: {
    duration: number | null;
  };
  _count: {
    id: number;
  };
}

// Add more types as needed for each dashboard