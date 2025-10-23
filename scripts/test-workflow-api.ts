/**
 * Workflow API Test Script
 * 
 * Tests all workflow management API endpoints
 * Requires a valid authentication session/token
 */

import { TriggerType, ActionType } from '../types/workflow'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const API_KEY = process.env.TEST_API_KEY || ''

console.log('='.repeat(70))
console.log('WORKFLOW API ENDPOINT TESTS')
console.log('='.repeat(70))
console.log('')

// Test workflow data
const testWorkflow = {
  name: 'Test Workflow - Project Creation Email',
  description: 'Send email notification when a new project is created',
  enabled: false,
  priority: 5,
  triggers: [
    {
      type: TriggerType.PROJECT_CREATED,
      config: {},
    },
  ],
  conditions: {
    operator: 'AND',
    conditions: [
      {
        field: 'entity.data.status',
        operator: 'EQUALS',
        value: 'PLANNING',
      },
    ],
  },
  actions: [
    {
      type: ActionType.SEND_EMAIL,
      config: {
        to: '{{entity.data.clientEmail}}',
        subject: 'New Project Created: {{entity.data.name}}',
        body: 'Your project has been created successfully.',
      },
      order: 1,
    },
  ],
  category: 'project-management',
  tags: ['email', 'notification', 'project'],
}

let createdWorkflowId: string | null = null

/**
 * Test POST /api/workflows - Create workflow
 */
async function testCreateWorkflow() {
  console.log('📝 Testing: POST /api/workflows (Create Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(testWorkflow),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow created successfully')
      console.log(`   ID: ${data.workflow?.id}`)
      console.log(`   Name: ${data.workflow?.name}`)
      createdWorkflowId = data.workflow?.id
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test GET /api/workflows - List workflows
 */
async function testListWorkflows() {
  console.log('📋 Testing: GET /api/workflows (List Workflows)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows?page=1&limit=10`, {
      headers: {
        'x-api-key': API_KEY,
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflows fetched successfully')
      console.log(`   Total: ${data.pagination?.total || 0}`)
      console.log(`   Page: ${data.pagination?.page}/${data.pagination?.totalPages}`)
      console.log(`   Workflows in response: ${data.workflows?.length || 0}`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test GET /api/workflows/[id] - Get single workflow
 */
async function testGetWorkflow() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: GET /api/workflows/[id] (No workflow ID)')
    console.log('')
    return
  }

  console.log('🔍 Testing: GET /api/workflows/[id] (Get Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}`, {
      headers: {
        'x-api-key': API_KEY,
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow fetched successfully')
      console.log(`   ID: ${data.id}`)
      console.log(`   Name: ${data.name}`)
      console.log(`   Enabled: ${data.enabled}`)
      console.log(`   Executions: ${data.executionCount}`)
      console.log(`   Success Rate: ${data.successRate?.toFixed(2)}%`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test PUT /api/workflows/[id] - Update workflow
 */
async function testUpdateWorkflow() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: PUT /api/workflows/[id] (No workflow ID)')
    console.log('')
    return
  }

  console.log('✏️  Testing: PUT /api/workflows/[id] (Update Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        description: 'Updated description - test',
        priority: 10,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow updated successfully')
      console.log(`   Updated fields: description, priority`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test PATCH /api/workflows/[id]/toggle - Toggle workflow
 */
async function testToggleWorkflow() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: PATCH /api/workflows/[id]/toggle (No workflow ID)')
    console.log('')
    return
  }

  console.log('🔄 Testing: PATCH /api/workflows/[id]/toggle (Toggle Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ enabled: true }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow toggled successfully')
      console.log(`   Status: ${data.workflow?.enabled ? 'Enabled' : 'Disabled'}`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test POST /api/workflows/[id]/test - Test workflow
 */
async function testTestWorkflow() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: POST /api/workflows/[id]/test (No workflow ID)')
    console.log('')
    return
  }

  console.log('🧪 Testing: POST /api/workflows/[id]/test (Test Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        entity: {
          type: 'project',
          id: 'test-project-123',
          data: {
            name: 'Test Project',
            status: 'PLANNING',
            clientEmail: 'test@example.com',
          },
        },
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow test completed')
      console.log(`   Would Execute: ${data.testResult?.wouldExecute ? 'Yes' : 'No'}`)
      console.log(`   Trigger Matched: ${data.testResult?.triggerMatched ? 'Yes' : 'No'}`)
      console.log(`   Conditions Passed: ${data.testResult?.conditionsPassed ? 'Yes' : 'No'}`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test POST /api/workflows/[id]/execute - Execute workflow
 */
async function testExecuteWorkflow() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: POST /api/workflows/[id]/execute (No workflow ID)')
    console.log('')
    return
  }

  console.log('⚡ Testing: POST /api/workflows/[id]/execute (Execute Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        entity: {
          type: 'project',
          id: 'test-project-123',
          data: {
            name: 'Test Project',
            status: 'PLANNING',
            clientEmail: 'test@example.com',
          },
        },
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow executed successfully')
      console.log(`   Execution ID: ${data.execution?.id}`)
      console.log(`   Status: ${data.execution?.status}`)
      console.log(`   Duration: ${data.execution?.duration}ms`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test GET /api/workflows/[id]/stats - Get statistics
 */
async function testGetStats() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: GET /api/workflows/[id]/stats (No workflow ID)')
    console.log('')
    return
  }

  console.log('📊 Testing: GET /api/workflows/[id]/stats (Get Statistics)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}/stats?days=7`, {
      headers: {
        'x-api-key': API_KEY,
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Statistics fetched successfully')
      console.log(`   Total Executions: ${data.overview?.totalExecutions}`)
      console.log(`   Success Rate: ${data.overview?.successRate}%`)
      console.log(`   Avg Duration: ${data.overview?.avgDurationMs}ms`)
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Test DELETE /api/workflows/[id] - Delete workflow
 */
async function testDeleteWorkflow() {
  if (!createdWorkflowId) {
    console.log('⏭️  Skipping: DELETE /api/workflows/[id] (No workflow ID)')
    console.log('')
    return
  }

  console.log('🗑️  Testing: DELETE /api/workflows/[id] (Delete Workflow)')
  console.log('-'.repeat(70))

  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${createdWorkflowId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY,
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Workflow deleted successfully')
    } else {
      console.log(`❌ Failed: ${response.status}`)
      console.log(`   Error: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('')
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting workflow API tests...')
  console.log(`Base URL: ${API_BASE_URL}`)
  console.log(`Auth: ${API_KEY ? 'API Key provided' : 'No API key (session auth)'}`)
  console.log('')

  await testCreateWorkflow()
  await testListWorkflows()
  await testGetWorkflow()
  await testUpdateWorkflow()
  await testToggleWorkflow()
  await testTestWorkflow()
  await testExecuteWorkflow()
  await testGetStats()
  await testDeleteWorkflow()

  console.log('='.repeat(70))
  console.log('TEST SUMMARY')
  console.log('='.repeat(70))
  console.log('All tests completed!')
  console.log('')
  console.log('Note: Some tests may fail if:')
  console.log('- Server is not running')
  console.log('- Authentication is not configured')
  console.log('- Database is not accessible')
  console.log('')
}

// Run tests
runAllTests()
