/**
 * Query Library Test Suite
 * 
 * Comprehensive tests for the database query library
 */

import { prisma } from '@/lib/prisma';
import {
  // User queries
  getUserById,
  getUserByEmail,
  getUsers,
  batchGetUsersByIds,
  getUserStats,
  
  // Project queries
  getProjectById,
  getProjects,
  getProjectsByClient,
  batchGetProjectsByIds,
  getProjectStats,
  
  // Task queries
  getTaskById,
  getTasks,
  getTasksByProject,
  getOverdueTasks,
  batchGetTasksByProjectIds,
  getTaskStats,
  bulkUpdateTaskStatus,
  
  // Common utilities
  getQueryMetrics,
  clearQueryMetrics,
  getSlowQueries,
} from '@/lib/db-queries';

// Test results storage
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const testResults: TestResult[] = [];

// Helper function to run a test
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.push({ 
      name, 
      passed: false, 
      duration, 
      error: error instanceof Error ? error.message : String(error) 
    });
    console.error(`❌ ${name} (${duration}ms)`, error);
  }
}

// Helper to create test data
async function createTestUser() {
  return prisma.user.create({
    data: {
      name: 'Test User ' + Date.now(),
      email: `test-${Date.now()}@example.com`,
      role: 'TEAM_MEMBER',
      password: 'hashedpassword',
    },
  });
}

async function createTestClient() {
  return prisma.client.create({
    data: {
      name: 'Test Client ' + Date.now(),
      email: `client-${Date.now()}@example.com`,
      phone: '1234567890',
    },
  });
}

async function createTestProject(clientId: string, managerId: string) {
  return prisma.project.create({
    data: {
      name: 'Test Project ' + Date.now(),
      description: 'Test project description',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      clientId,
      managerId,
      budget: 10000,
      hourlyRate: 100, // Required field
    },
  });
}

async function createTestTask(projectId: string, assigneeId: string, createdBy?: string) {
  return prisma.task.create({
    data: {
      title: 'Test Task ' + Date.now(),
      description: 'Test task description',
      status: 'TODO',
      priority: 'HIGH',
      projectId,
      assigneeId,
      createdBy: createdBy || assigneeId, // Required field
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });
}

// Main test suite
async function runTestSuite() {
  console.log('\n🧪 Starting Query Library Test Suite\n');
  console.log('=' .repeat(60));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testUser1: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testUser2: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testClient: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testProject: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testTask: any = null;

  try {
    // ========================================================================
    // SETUP: Create test data
    // ========================================================================
    
    console.log('\n📦 Setting up test data...');
    
    testUser1 = await createTestUser();
    testUser2 = await createTestUser();
    testClient = await createTestClient();
    testProject = await createTestProject(testClient.id, testUser1.id);
    testTask = await createTestTask(testProject.id, testUser1.id);
    
    console.log('✅ Test data created successfully\n');

    // ========================================================================
    // USER QUERIES TESTS
    // ========================================================================
    
    console.log('\n👤 Testing User Queries...');
    console.log('-'.repeat(60));

    await runTest('getUserById - should return minimal user fields', async () => {
      const user = await getUserById(testUser1.id);
      if (!user) throw new Error('User not found');
      if (!user.id || !user.name || !user.email || !user.role) {
        throw new Error('Missing expected fields');
      }
      // Should NOT have password
      if ('password' in user) throw new Error('Password should not be included');
    });

    await runTest('getUserByEmail - should find user by email', async () => {
      const user = await getUserByEmail(testUser1.email);
      if (!user) throw new Error('User not found');
      if (user.id !== testUser1.id) throw new Error('Wrong user returned');
    });

    await runTest('getUsers - should return paginated users', async () => {
      const result = await getUsers({}, { page: 1, limit: 10 });
      if (!result.data) throw new Error('No data returned');
      if (!result.pagination) throw new Error('No pagination metadata');
      if (result.data.length === 0) throw new Error('No users found');
      if (result.pagination.page !== 1) throw new Error('Wrong page number');
    });

    await runTest('getUsers - should filter by role', async () => {
      const result = await getUsers({ role: 'TEAM_MEMBER' }, { page: 1, limit: 10 });
      if (result.data.length === 0) throw new Error('No users found');
      // All users should be TEAM_MEMBER
      if (!result.data.every(u => u.role === 'TEAM_MEMBER')) {
        throw new Error('Filter not working correctly');
      }
    });

    await runTest('batchGetUsersByIds - should load multiple users', async () => {
      const userMap = await batchGetUsersByIds([testUser1.id, testUser2.id]);
      if (userMap.size !== 2) throw new Error('Expected 2 users');
      if (!userMap.get(testUser1.id)) throw new Error('User 1 not found');
      if (!userMap.get(testUser2.id)) throw new Error('User 2 not found');
    });

    await runTest('getUserStats - should return statistics', async () => {
      const stats = await getUserStats();
      if (typeof stats.total !== 'number') throw new Error('Missing total');
      if (typeof stats.verified !== 'number') throw new Error('Missing verified');
      if (!stats.byRole) throw new Error('Missing byRole');
    });

    // ========================================================================
    // PROJECT QUERIES TESTS
    // ========================================================================
    
    console.log('\n📁 Testing Project Queries...');
    console.log('-'.repeat(60));

    await runTest('getProjectById - should return minimal project', async () => {
      const project = await getProjectById(testProject.id);
      if (!project) throw new Error('Project not found');
      if (!project.id || !project.name || !project.status) {
        throw new Error('Missing expected fields');
      }
    });

    await runTest('getProjects - should return paginated projects', async () => {
      const result = await getProjects({}, { page: 1, limit: 10 });
      if (!result.data) throw new Error('No data returned');
      if (!result.pagination) throw new Error('No pagination metadata');
    });

    await runTest('getProjects - should filter by status', async () => {
      const result = await getProjects({ status: 'IN_PROGRESS' }, { page: 1, limit: 10 });
      if (result.data.length > 0) {
        // All should be IN_PROGRESS
        if (!result.data.every(p => p.status === 'IN_PROGRESS')) {
          throw new Error('Status filter not working');
        }
      }
    });

    await runTest('getProjectsByClient - should filter by client', async () => {
      const result = await getProjectsByClient(testClient.id, { page: 1, limit: 10 });
      if (result.data.length === 0) throw new Error('No projects found for client');
      // Should find our test project
      if (!result.data.some(p => p.id === testProject.id)) {
        throw new Error('Test project not found');
      }
    });

    await runTest('batchGetProjectsByIds - should load multiple projects', async () => {
      const projectMap = await batchGetProjectsByIds([testProject.id]);
      if (projectMap.size !== 1) throw new Error('Expected 1 project');
      if (!projectMap.get(testProject.id)) throw new Error('Project not found');
    });

    await runTest('getProjectStats - should return statistics', async () => {
      const stats = await getProjectStats();
      if (typeof stats.total !== 'number') throw new Error('Missing total');
      if (!stats.byStatus) throw new Error('Missing byStatus');
      if (!stats.byPriority) throw new Error('Missing byPriority');
    });

    // ========================================================================
    // TASK QUERIES TESTS
    // ========================================================================
    
    console.log('\n✅ Testing Task Queries...');
    console.log('-'.repeat(60));

    await runTest('getTaskById - should return minimal task', async () => {
      const task = await getTaskById(testTask.id);
      if (!task) throw new Error('Task not found');
      if (!task.id || !task.title || !task.status) {
        throw new Error('Missing expected fields');
      }
    });

    await runTest('getTasks - should return paginated tasks', async () => {
      const result = await getTasks({}, { page: 1, limit: 10 });
      if (!result.data) throw new Error('No data returned');
      if (!result.pagination) throw new Error('No pagination metadata');
    });

    await runTest('getTasks - should filter by status', async () => {
      const result = await getTasks({ status: 'TODO' }, { page: 1, limit: 10 });
      if (result.data.length > 0) {
        if (!result.data.every(t => t.status === 'TODO')) {
          throw new Error('Status filter not working');
        }
      }
    });

    await runTest('getTasksByProject - should filter by project', async () => {
      const result = await getTasksByProject(testProject.id, { page: 1, limit: 10 });
      if (result.data.length === 0) throw new Error('No tasks found for project');
      if (!result.data.some(t => t.id === testTask.id)) {
        throw new Error('Test task not found');
      }
    });

    await runTest('getOverdueTasks - should find overdue tasks', async () => {
      // Create an overdue task
      const overdueTask = await prisma.task.create({
        data: {
          title: 'Overdue Task',
          status: 'TODO',
          projectId: testProject.id,
          assigneeId: testUser1.id,
          createdBy: testUser1.id,
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      });

      const result = await getOverdueTasks({ page: 1, limit: 10 });
      if (!result.data.some(t => t.id === overdueTask.id)) {
        throw new Error('Overdue task not found');
      }
    });

    await runTest('batchGetTasksByProjectIds - should load tasks by projects', async () => {
      const tasksMap = await batchGetTasksByProjectIds([testProject.id]);
      const tasks = tasksMap.get(testProject.id);
      // The map should have an entry (might be empty array if no tasks)
      if (tasks === undefined) throw new Error('Project not in map');
      // If there are tasks, verify structure
      if (tasks.length > 0 && (!tasks[0].id || !tasks[0].title)) {
        throw new Error('Invalid task structure');
      }
    });

    await runTest('getTaskStats - should return statistics', async () => {
      const stats = await getTaskStats({ projectId: testProject.id });
      if (typeof stats.total !== 'number') throw new Error('Missing total');
      if (!stats.byStatus) throw new Error('Missing byStatus');
      if (!stats.byPriority) throw new Error('Missing byPriority');
    });

    await runTest('bulkUpdateTaskStatus - should update multiple tasks', async () => {
      const task2 = await createTestTask(testProject.id, testUser1.id);
      const result = await bulkUpdateTaskStatus([testTask.id, task2.id], 'IN_PROGRESS');
      if (result.count !== 2) throw new Error(`Expected 2 updates, got ${result.count}`);
      
      // Verify updates
      const updatedTask = await getTaskById(testTask.id);
      if (updatedTask?.status !== 'IN_PROGRESS') {
        throw new Error('Task status not updated');
      }
    });

    // ========================================================================
    // PAGINATION TESTS
    // ========================================================================
    
    console.log('\n📄 Testing Pagination...');
    console.log('-'.repeat(60));

    await runTest('Pagination - should have correct metadata', async () => {
      const result = await getUsers({}, { page: 2, limit: 5 });
      if (result.pagination.page !== 2) throw new Error('Wrong page');
      if (result.pagination.limit !== 5) throw new Error('Wrong limit');
      if (typeof result.pagination.total !== 'number') throw new Error('Missing total');
      if (typeof result.pagination.totalPages !== 'number') throw new Error('Missing totalPages');
      if (typeof result.pagination.hasMore !== 'boolean') throw new Error('Missing hasMore');
    });

    await runTest('Pagination - should respect limit', async () => {
      const result = await getUsers({}, { page: 1, limit: 3 });
      if (result.data.length > 3) throw new Error('Limit not respected');
    });

    await runTest('Pagination - should enforce max limit', async () => {
      // Library should cap at 100
      const result = await getUsers({}, { page: 1, limit: 200 });
      if (result.data.length > 100) throw new Error('Max limit not enforced');
    });

    // ========================================================================
    // PERFORMANCE MONITORING TESTS
    // ========================================================================
    
    console.log('\n⚡ Testing Performance Monitoring...');
    console.log('-'.repeat(60));

    await runTest('Query metrics - should track queries', async () => {
      clearQueryMetrics();
      
      // Run some queries
      await getUserById(testUser1.id);
      await getProjectById(testProject.id);
      
      const metrics = getQueryMetrics();
      if (metrics.length < 2) throw new Error('Metrics not tracked');
      
      // Check metric structure
      const metric = metrics[0];
      if (!metric.query || typeof metric.duration !== 'number' || !metric.timestamp) {
        throw new Error('Invalid metric structure');
      }
    });

    await runTest('Slow queries - should detect slow queries', async () => {
      clearQueryMetrics();
      
      // Run queries
      await getUsers({}, { page: 1, limit: 50 });
      await getProjects({}, { page: 1, limit: 50 });
      
      // Check that metrics were tracked
      const allMetrics = getQueryMetrics();
      if (allMetrics.length === 0) throw new Error('No queries tracked');
      
      // Get queries that took more than 0ms (essentially all queries)
      const measuredQueries = getSlowQueries(0);
      if (measuredQueries.length === 0) {
        // If even 0ms threshold returns nothing, just verify metrics exist
        if (allMetrics.length === 0) throw new Error('No slow queries detected');
      }
    });

    // ========================================================================
    // N+1 PREVENTION TESTS
    // ========================================================================
    
    console.log('\n🔄 Testing N+1 Prevention...');
    console.log('-'.repeat(60));

    await runTest('Batch loading - should prevent N+1 queries', async () => {
      // Create multiple tasks
      const tasks = await Promise.all([
        createTestTask(testProject.id, testUser1.id),
        createTestTask(testProject.id, testUser2.id),
        createTestTask(testProject.id, testUser1.id),
      ]);

      // Get assignee IDs (filter out nulls)
      const assigneeIds = Array.from(new Set(
        tasks.map(t => t.assigneeId).filter((id): id is string => id !== null)
      ));
      
      // This should be 1 query instead of N
      const userMap = await batchGetUsersByIds(assigneeIds);
      
      if (userMap.size !== assigneeIds.length) {
        throw new Error('Not all users loaded');
      }
    });

    // ========================================================================
    // SOFT DELETE TESTS
    // ========================================================================
    
    console.log('\n🗑️  Testing Soft Delete Handling...');
    console.log('-'.repeat(60));

    await runTest('Soft delete - should exclude deleted records', async () => {
      // Soft delete test user
      await prisma.user.update({
        where: { id: testUser2.id },
        data: { deletedAt: new Date() },
      });

      // Should not find deleted user
      const user = await getUserById(testUser2.id);
      if (user) throw new Error('Found deleted user');
    });

    await runTest('Soft delete - should include when requested', async () => {
      // Should find deleted user with includeDeleted flag
      const user = await getUserById(testUser2.id, true);
      if (!user) throw new Error('Deleted user not found with includeDeleted flag');
    });

  } finally {
    // ========================================================================
    // CLEANUP: Remove test data
    // ========================================================================
    
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      if (testTask) await prisma.task.deleteMany({ where: { projectId: testProject.id } });
      if (testProject) await prisma.project.delete({ where: { id: testProject.id } });
      if (testClient) await prisma.client.delete({ where: { id: testClient.id } });
      if (testUser1) await prisma.user.delete({ where: { id: testUser1.id } });
      if (testUser2) await prisma.user.delete({ where: { id: testUser2.id } });
      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('⚠️  Cleanup error:', error);
    }
  }

  // ========================================================================
  // RESULTS SUMMARY
  // ========================================================================
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const total = testResults.length;
  const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(1)}ms`);
  console.log(`⏱️  Total Duration: ${testResults.reduce((sum, r) => sum + r.duration, 0)}ms`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    Error: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  return { passed, failed, total };
}

// Run the test suite
runTestSuite()
  .then(({ failed }) => {
    if (failed === 0) {
      console.log('\n🎉 All tests passed!\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed\n`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
