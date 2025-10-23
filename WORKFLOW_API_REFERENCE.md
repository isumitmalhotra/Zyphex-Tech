# Workflow Automation - API Reference

**Version**: 1.0  
**Last Updated**: October 21, 2025  
**Base URL**: `https://your-domain.com/api`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Workflows API](#workflows-api)
3. [Workflow Execution API](#workflow-execution-api)
4. [Workflow Statistics API](#workflow-statistics-api)
5. [Webhook API](#webhook-api)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Authentication

All API endpoints require authentication via NextAuth session cookie or API token.

### Headers

```
Cookie: next-auth.session-token=your-session-token
Content-Type: application/json
```

### Required Permissions

- **ADMIN** or **SUPER_ADMIN** role required for all workflow management endpoints
- **Any authenticated user** can view workflows they have access to

---

## Workflows API

### List Workflows

Get paginated list of workflows with optional filtering.

**Endpoint:** `GET /api/workflows`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (1-indexed) |
| limit | number | No | 20 | Items per page (max: 100) |
| enabled | boolean | No | - | Filter by enabled status |
| category | string | No | - | Filter by category |
| search | string | No | - | Search in name/description |

**Request Example:**

```bash
GET /api/workflows?page=1&limit=20&enabled=true&category=project_management
```

**Response: 200 OK**

```json
{
  "workflows": [
    {
      "id": "wf_abc123",
      "name": "New Project Notification",
      "description": "Send email when project is created",
      "enabled": true,
      "version": 1,
      "triggers": [
        {
          "type": "PROJECT_CREATED",
          "config": {}
        }
      ],
      "conditions": null,
      "actions": [
        {
          "type": "SEND_EMAIL",
          "config": {
            "to": "team@company.com",
            "subject": "New Project: {{entity.data.name}}",
            "body": "A new project has been created..."
          },
          "order": 1
        }
      ],
      "priority": 5,
      "maxRetries": 3,
      "retryDelay": 60,
      "timeout": 300,
      "category": "project_management",
      "tags": ["email", "project", "notification"],
      "executionCount": 42,
      "successCount": 40,
      "failureCount": 2,
      "lastExecutionAt": "2025-10-21T10:30:00Z",
      "avgExecutionMs": 1523.5,
      "successRate": 95.24,
      "createdAt": "2025-10-01T12:00:00Z",
      "updatedAt": "2025-10-20T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Get Workflow

Get a single workflow by ID.

**Endpoint:** `GET /api/workflows/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Request Example:**

```bash
GET /api/workflows/wf_abc123
```

**Response: 200 OK**

```json
{
  "workflow": {
    "id": "wf_abc123",
    "name": "New Project Notification",
    "description": "Send email when project is created",
    "enabled": true,
    "version": 1,
    "triggers": [...],
    "conditions": null,
    "actions": [...],
    "priority": 5,
    "maxRetries": 3,
    "retryDelay": 60,
    "timeout": 300,
    "category": "project_management",
    "tags": ["email", "project"],
    "executionCount": 42,
    "successCount": 40,
    "failureCount": 2,
    "lastExecutionAt": "2025-10-21T10:30:00Z",
    "avgExecutionMs": 1523.5,
    "createdAt": "2025-10-01T12:00:00Z",
    "updatedAt": "2025-10-20T15:30:00Z"
  }
}
```

**Response: 404 Not Found**

```json
{
  "error": "Workflow not found"
}
```

### Create Workflow

Create a new workflow.

**Endpoint:** `POST /api/workflows`

**Request Body:**

```json
{
  "name": "New Project Notification",
  "description": "Send email when project is created",
  "enabled": false,
  "triggers": [
    {
      "type": "PROJECT_CREATED",
      "config": {}
    }
  ],
  "conditions": null,
  "actions": [
    {
      "type": "SEND_EMAIL",
      "config": {
        "to": "team@company.com",
        "subject": "New Project: {{entity.data.name}}",
        "body": "A new project has been created..."
      },
      "order": 1
    }
  ],
  "priority": 5,
  "maxRetries": 3,
  "retryDelay": 60,
  "timeout": 300,
  "category": "project_management",
  "tags": ["email", "project", "notification"]
}
```

**Response: 201 Created**

```json
{
  "workflow": {
    "id": "wf_new456",
    "name": "New Project Notification",
    "enabled": false,
    "version": 1,
    "createdAt": "2025-10-21T14:00:00Z",
    "updatedAt": "2025-10-21T14:00:00Z"
  },
  "message": "Workflow created successfully"
}
```

**Response: 400 Bad Request**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "triggers",
      "message": "At least one trigger is required"
    }
  ]
}
```

### Update Workflow

Update an existing workflow.

**Endpoint:** `PUT /api/workflows/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Request Body:** (Same as Create Workflow)

**Response: 200 OK**

```json
{
  "workflow": {
    "id": "wf_abc123",
    "name": "Updated Workflow Name",
    "version": 2,
    "updatedAt": "2025-10-21T14:30:00Z"
  },
  "message": "Workflow updated successfully"
}
```

**Response: 404 Not Found**

```json
{
  "error": "Workflow not found"
}
```

### Delete Workflow

Delete a workflow (soft delete).

**Endpoint:** `DELETE /api/workflows/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Response: 200 OK**

```json
{
  "message": "Workflow deleted successfully"
}
```

**Response: 404 Not Found**

```json
{
  "error": "Workflow not found"
}
```

### Toggle Workflow

Enable or disable a workflow.

**Endpoint:** `PATCH /api/workflows/:id/toggle`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Request Body:**

```json
{
  "enabled": true
}
```

**Response: 200 OK**

```json
{
  "workflow": {
    "id": "wf_abc123",
    "enabled": true
  },
  "message": "Workflow status updated"
}
```

### Test Workflow

Test a workflow with mock data (dry run).

**Endpoint:** `POST /api/workflows/:id/test`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Request Body:**

```json
{
  "entity": {
    "type": "project",
    "id": "proj_test123",
    "data": {
      "name": "Test Project",
      "status": "PLANNING",
      "priority": "HIGH",
      "clientEmail": "client@example.com"
    }
  }
}
```

**Response: 200 OK**

```json
{
  "testResult": {
    "wouldExecute": true,
    "triggerMatched": true,
    "conditionsPassed": true
  },
  "evaluation": {
    "triggers": [
      {
        "trigger": "PROJECT_CREATED",
        "matched": true
      }
    ],
    "conditions": null,
    "actions": [
      {
        "type": "SEND_EMAIL",
        "order": 1,
        "config": {
          "to": "team@company.com",
          "subject": "New Project: Test Project",
          "body": "A new project has been created..."
        },
        "willExecute": true
      }
    ]
  },
  "context": {
    "entityType": "project",
    "entityId": "proj_test123"
  },
  "workflow": {
    "id": "wf_abc123",
    "name": "New Project Notification"
  },
  "notes": [
    "This is a dry run. No actual actions were executed.",
    "All configured actions would execute in production."
  ]
}
```

---

## Workflow Execution API

### List Workflow Executions

Get execution history for a workflow.

**Endpoint:** `GET /api/workflows/:id/execute`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Items per page (max: 100) |
| status | string | No | - | Filter by status (SUCCESS, FAILED, RUNNING, PENDING) |

**Request Example:**

```bash
GET /api/workflows/wf_abc123/execute?page=1&limit=50&status=SUCCESS
```

**Response: 200 OK**

```json
{
  "executions": [
    {
      "id": "exec_xyz789",
      "workflowId": "wf_abc123",
      "status": "SUCCESS",
      "triggerType": "PROJECT_CREATED",
      "triggerData": {
        "entity": {
          "type": "project",
          "id": "proj_456",
          "data": {...}
        }
      },
      "context": {},
      "result": {
        "actionsExecuted": 1,
        "actionsSuccessful": 1,
        "actionsFailed": 0
      },
      "error": null,
      "startedAt": "2025-10-21T10:30:00Z",
      "completedAt": "2025-10-21T10:30:02Z",
      "durationMs": 1523,
      "retryCount": 0,
      "createdAt": "2025-10-21T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 42,
    "totalPages": 1
  }
}
```

### Get Execution Details

Get detailed information about a specific execution.

**Endpoint:** `GET /api/workflows/:workflowId/executions/:executionId`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workflowId | string | Yes | Workflow ID |
| executionId | string | Yes | Execution ID |

**Response: 200 OK**

```json
{
  "execution": {
    "id": "exec_xyz789",
    "workflowId": "wf_abc123",
    "status": "SUCCESS",
    "triggerType": "PROJECT_CREATED",
    "triggerData": {...},
    "context": {},
    "result": {...},
    "error": null,
    "startedAt": "2025-10-21T10:30:00Z",
    "completedAt": "2025-10-21T10:30:02Z",
    "durationMs": 1523,
    "retryCount": 0
  },
  "logs": [
    {
      "id": "log_001",
      "executionId": "exec_xyz789",
      "level": "INFO",
      "message": "Workflow execution started",
      "data": null,
      "timestamp": "2025-10-21T10:30:00.000Z"
    },
    {
      "id": "log_002",
      "level": "INFO",
      "message": "Trigger matched: PROJECT_CREATED",
      "data": {"triggerType": "PROJECT_CREATED"},
      "timestamp": "2025-10-21T10:30:00.100Z"
    },
    {
      "id": "log_003",
      "level": "INFO",
      "message": "Executing action: SEND_EMAIL",
      "data": {"actionType": "SEND_EMAIL", "order": 1},
      "timestamp": "2025-10-21T10:30:01.000Z"
    },
    {
      "id": "log_004",
      "level": "INFO",
      "message": "Action completed successfully",
      "data": {"actionType": "SEND_EMAIL", "duration": 523},
      "timestamp": "2025-10-21T10:30:01.523Z"
    },
    {
      "id": "log_005",
      "level": "INFO",
      "message": "Workflow execution completed",
      "data": {"totalDuration": 1523, "status": "SUCCESS"},
      "timestamp": "2025-10-21T10:30:02.000Z"
    }
  ]
}
```

### Execute Workflow Manually

Manually trigger a workflow execution.

**Endpoint:** `POST /api/workflows/:id/execute`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Request Body:**

```json
{
  "triggerData": {
    "entity": {
      "type": "project",
      "id": "proj_789",
      "data": {
        "name": "Manual Test Project",
        "status": "PLANNING"
      }
    }
  }
}
```

**Response: 202 Accepted**

```json
{
  "execution": {
    "id": "exec_new123",
    "workflowId": "wf_abc123",
    "status": "PENDING",
    "createdAt": "2025-10-21T14:45:00Z"
  },
  "message": "Workflow execution queued"
}
```

---

## Workflow Statistics API

### Get Workflow Statistics

Get performance statistics for a workflow.

**Endpoint:** `GET /api/workflows/:id/stats`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Workflow ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| days | number | No | 30 | Number of days to include |

**Request Example:**

```bash
GET /api/workflows/wf_abc123/stats?days=30
```

**Response: 200 OK**

```json
{
  "overview": {
    "totalExecutions": 42,
    "successfulExecutions": 40,
    "failedExecutions": 2,
    "successRate": 95.24,
    "avgDurationMs": 1523.5,
    "avgDurationSeconds": 1.52
  },
  "statusBreakdown": {
    "SUCCESS": 40,
    "FAILED": 2,
    "RUNNING": 0,
    "PENDING": 0
  },
  "trend": [
    {
      "date": "2025-10-21",
      "success": 5,
      "failed": 0,
      "total": 5,
      "successRate": 100
    },
    {
      "date": "2025-10-20",
      "success": 8,
      "failed": 1,
      "total": 9,
      "successRate": 88.89
    }
  ],
  "workflow": {
    "id": "wf_abc123",
    "name": "New Project Notification",
    "enabled": true,
    "lastExecutionAt": "2025-10-21T10:30:00Z",
    "totalExecutions": 42,
    "totalSuccess": 40,
    "totalFailure": 2
  },
  "timeRange": {
    "days": 30,
    "startDate": "2025-09-21",
    "endDate": "2025-10-21"
  }
}
```

---

## Webhook API

### Trigger Workflow via Webhook

Trigger a workflow using its configured webhook path.

**Endpoint:** `POST /api/webhooks/:path`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| path | string | Yes | Custom webhook path configured in workflow |

**Headers:**

```
Content-Type: application/json
X-Webhook-Signature: sha256=signature (optional, for verification)
X-Webhook-Source: source-identifier (optional)
```

**Request Body:** (Flexible, depends on workflow configuration)

```json
{
  "event": "project.created",
  "data": {
    "projectId": "proj_123",
    "projectName": "New Project",
    "clientEmail": "client@example.com"
  }
}
```

**Response: 202 Accepted**

```json
{
  "message": "Webhook received and workflow execution queued",
  "executionId": "exec_webhook123",
  "workflowId": "wf_abc123"
}
```

**Response: 404 Not Found**

```json
{
  "error": "No workflow found for webhook path"
}
```

**Response: 400 Bad Request**

```json
{
  "error": "Invalid webhook signature"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted, processing async |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2025-10-21T14:00:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| WORKFLOW_NOT_FOUND | Workflow does not exist |
| WORKFLOW_DISABLED | Workflow is disabled |
| VALIDATION_ERROR | Request validation failed |
| UNAUTHORIZED | User not authenticated |
| FORBIDDEN | User lacks required permissions |
| RATE_LIMIT_EXCEEDED | Too many requests |
| EXECUTION_FAILED | Workflow execution failed |
| EXECUTION_TIMEOUT | Execution exceeded timeout |
| ACTION_FAILED | Action execution failed |
| TRIGGER_NOT_FOUND | Trigger type not supported |
| INVALID_CONFIGURATION | Workflow configuration invalid |

---

## Rate Limiting

### Limits

- **Default**: 60 requests per minute per IP
- **Authenticated**: 120 requests per minute per user
- **Webhook**: 100 requests per minute per webhook path

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698765432
```

### Rate Limit Exceeded Response

**Response: 429 Too Many Requests**

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 60,
  "remaining": 0,
  "reset": 1698765432
}
```

---

## Examples

### Example 1: Create and Enable Workflow

```javascript
// Step 1: Create workflow
const createResponse = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Project Email',
    description: 'Send email on project creation',
    enabled: false,
    triggers: [{ type: 'PROJECT_CREATED', config: {} }],
    actions: [
      {
        type: 'SEND_EMAIL',
        config: {
          to: 'team@company.com',
          subject: 'New Project: {{entity.data.name}}',
          body: 'Project created...'
        },
        order: 1
      }
    ],
    priority: 5,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    category: 'project_management',
    tags: ['email', 'project']
  })
})

const { workflow } = await createResponse.json()
console.log('Created workflow:', workflow.id)

// Step 2: Test workflow
const testResponse = await fetch(`/api/workflows/${workflow.id}/test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entity: {
      type: 'project',
      id: 'test-123',
      data: { name: 'Test Project', status: 'PLANNING' }
    }
  })
})

const testResult = await testResponse.json()
console.log('Test result:', testResult)

// Step 3: Enable workflow
const toggleResponse = await fetch(`/api/workflows/${workflow.id}/toggle`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true })
})

console.log('Workflow enabled!')
```

### Example 2: Monitor Workflow Performance

```javascript
// Get workflow statistics
const statsResponse = await fetch('/api/workflows/wf_abc123/stats?days=7')
const stats = await statsResponse.json()

console.log(`Success Rate: ${stats.overview.successRate}%`)
console.log(`Total Executions: ${stats.overview.totalExecutions}`)
console.log(`Avg Duration: ${stats.overview.avgDurationSeconds}s`)

// Get recent executions
const executionsResponse = await fetch('/api/workflows/wf_abc123/execute?limit=10&status=FAILED')
const executions = await executionsResponse.json()

// Analyze failures
for (const execution of executions.executions) {
  console.log(`Failed execution ${execution.id}: ${execution.error}`)
}
```

### Example 3: Webhook Integration

```javascript
// External system triggering workflow via webhook
const webhookResponse = await fetch('https://your-domain.com/api/webhooks/new-project', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Source': 'external-crm',
    'X-Webhook-Signature': 'sha256=...' // Optional signature
  },
  body: JSON.stringify({
    event: 'project.created',
    data: {
      projectId: 'ext-proj-123',
      projectName: 'External Project',
      clientEmail: 'client@example.com',
      priority: 'HIGH'
    }
  })
})

const result = await webhookResponse.json()
console.log('Workflow execution queued:', result.executionId)
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { WorkflowClient } from '@/lib/workflow-client'

const client = new WorkflowClient({
  baseUrl: 'https://your-domain.com',
  apiKey: 'your-api-key'
})

// Create workflow
const workflow = await client.workflows.create({
  name: 'New Workflow',
  triggers: [...],
  actions: [...]
})

// Get workflow
const existing = await client.workflows.get(workflow.id)

// List workflows
const { workflows, pagination } = await client.workflows.list({
  page: 1,
  limit: 20,
  enabled: true
})

// Update workflow
await client.workflows.update(workflow.id, { name: 'Updated Name' })

// Execute workflow
const execution = await client.workflows.execute(workflow.id, {
  triggerData: {...}
})

// Get statistics
const stats = await client.workflows.getStats(workflow.id, { days: 30 })
```

---

**End of API Reference**

*For user instructions, see WORKFLOW_USER_GUIDE.md*  
*For system administration, see WORKFLOW_ADMIN_GUIDE.md*
