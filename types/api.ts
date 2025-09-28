// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Request body types for API endpoints
export interface CreateTaskRequest {
  title: string
  description?: string
  status?: string
  priority?: string
  projectId: string
  assigneeId?: string
  dueDate?: string
  estimatedHours?: number
  tags?: string[]
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  taskId: string
  actualHours?: number
  completedAt?: string
}

// Query parameter types
export interface TaskFilters {
  status?: string
  priority?: string
  projectId?: string
  assigneeId?: string
  dueDate?: string
  page?: number
  limit?: number
}
