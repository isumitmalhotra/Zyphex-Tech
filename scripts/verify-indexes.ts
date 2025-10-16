/**
 * Database Index Verification Script
 * 
 * This script verifies that all database indexes have been created successfully
 * and provides performance analysis for key queries.
 * 
 * Run with: npm run db:verify-indexes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IndexInfo {
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface TableStats {
  tablename: string;
  row_count: bigint;
  total_size: string;
  index_size: string;
}

const EXPECTED_INDEXES = {
  User: [
    'User_email_idx',
    'User_role_idx',
    'User_deletedAt_idx',
    'User_createdAt_idx',
    'User_updatedAt_idx',
    'User_emailVerified_idx',
    'User_role_deletedAt_idx',
    'User_role_createdAt_idx',
    'User_email_deletedAt_idx'
  ],
  Project: [
    'Project_clientId_idx',
    'Project_managerId_idx',
    'Project_status_idx',
    'Project_priority_idx',
    'Project_methodology_idx',
    'Project_templateId_idx',
    'Project_startDate_endDate_idx',
    'Project_deletedAt_idx',
    'Project_createdAt_idx',
    'Project_updatedAt_idx',
    'Project_completionRate_idx',
    'Project_isClientVisible_idx',
    'Project_clientId_status_idx',
    'Project_managerId_status_idx',
    'Project_clientId_status_deletedAt_idx',
    'Project_status_priority_createdAt_idx',
    'Project_status_updatedAt_idx',
    'Project_managerId_priority_status_idx'
  ],
  Task: [
    'Task_projectId_idx',
    'Task_assigneeId_idx',
    'Task_createdBy_idx',
    'Task_status_idx',
    'Task_priority_idx',
    'Task_dueDate_idx',
    'Task_isBlocking_idx',
    'Task_createdAt_idx',
    'Task_updatedAt_idx',
    'Task_completedAt_idx',
    'Task_startDate_idx',
    'Task_isMilestone_idx',
    'Task_projectId_status_idx',
    'Task_assigneeId_status_idx',
    'Task_projectId_assigneeId_idx',
    'Task_status_priority_dueDate_idx',
    'Task_assigneeId_dueDate_status_idx',
    'Task_projectId_priority_status_idx',
    'Task_status_dueDate_idx',
    'Task_assigneeId_priority_idx'
  ],
  TimeEntry: [
    'TimeEntry_userId_idx',
    'TimeEntry_taskId_idx',
    'TimeEntry_projectId_idx',
    'TimeEntry_date_idx',
    'TimeEntry_billable_idx',
    'TimeEntry_status_idx',
    'TimeEntry_invoiceId_idx',
    'TimeEntry_createdAt_idx',
    'TimeEntry_userId_date_idx',
    'TimeEntry_projectId_date_idx',
    'TimeEntry_userId_status_idx',
    'TimeEntry_billable_status_date_idx',
    'TimeEntry_projectId_billable_status_idx',
    'TimeEntry_userId_projectId_date_idx'
  ],
  Invoice: [
    'Invoice_clientId_idx',
    'Invoice_projectId_idx',
    'Invoice_status_idx',
    'Invoice_dueDate_idx',
    'Invoice_invoiceNumber_idx',
    'Invoice_overdueAt_idx',
    'Invoice_createdAt_idx',
    'Invoice_sentAt_idx',
    'Invoice_paidAt_idx',
    'Invoice_billingType_idx',
    'Invoice_clientId_status_idx',
    'Invoice_status_dueDate_idx',
    'Invoice_clientId_status_dueDate_idx',
    'Invoice_projectId_status_idx',
    'Invoice_status_createdAt_idx',
    'Invoice_clientId_dueDate_idx'
  ],
  Message: [
    'Message_senderId_idx',
    'Message_receiverId_idx',
    'Message_channelId_idx',
    'Message_projectId_idx',
    'Message_createdAt_idx',
    'Message_readAt_idx',
    'Message_parentId_idx',
    'Message_messageType_idx',
    'Message_priority_idx',
    'Message_senderId_createdAt_idx',
    'Message_receiverId_readAt_idx',
    'Message_channelId_createdAt_idx',
    'Message_projectId_createdAt_idx',
    'Message_receiverId_readAt_createdAt_idx'
  ],
  Notification: [
    'Notification_userId_idx',
    'Notification_read_idx',
    'Notification_type_idx',
    'Notification_relatedType_relatedId_idx',
    'Notification_createdAt_idx',
    'Notification_projectId_idx',
    'Notification_userId_read_idx',
    'Notification_userId_createdAt_idx',
    'Notification_userId_read_createdAt_idx',
    'Notification_type_createdAt_idx'
  ]
};

async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  try {
    const indexes = await prisma.$queryRaw<IndexInfo[]>`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = ${tableName}
      ORDER BY indexname;
    `;
    return indexes;
  } catch (error) {
    console.error(`Error fetching indexes for ${tableName}:`, error);
    return [];
  }
}

async function getTableStats(): Promise<TableStats[]> {
  try {
    const stats = await prisma.$queryRaw<TableStats[]>`
      SELECT 
        schemaname || '.' || tablename AS tablename,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
    return stats;
  } catch (error) {
    console.error('Error fetching table stats:', error);
    return [];
  }
}

async function analyzeQuery(query: string, description: string): Promise<void> {
  try {
    console.log(`\n📊 Analyzing: ${description}`);
    const explain = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`EXPLAIN ANALYZE ${query}`;
    
    const planRows = explain.map((row) => row['QUERY PLAN']).join('\n');
    
    // Extract key metrics
    const executionTimeMatch = planRows.match(/Execution Time: ([\d.]+) ms/);
    const planningTimeMatch = planRows.match(/Planning Time: ([\d.]+) ms/);
    const indexScanMatch = planRows.match(/Index Scan|Index Only Scan/);
    
    console.log(`   ⏱️  Execution Time: ${executionTimeMatch?.[1] || 'N/A'} ms`);
    console.log(`   📋 Planning Time: ${planningTimeMatch?.[1] || 'N/A'} ms`);
    console.log(`   🔍 Uses Index: ${indexScanMatch ? '✅ Yes' : '❌ No (Seq Scan)'}`);
    
    if (!indexScanMatch) {
      console.log('   ⚠️  WARNING: Query is not using indexes!');
    }
  } catch (error) {
    console.error(`   ❌ Error analyzing query:`, error);
  }
}

async function main() {
  console.log('🔍 DATABASE INDEX VERIFICATION SCRIPT');
  console.log('=====================================\n');

  let totalIndexes = 0;
  const missingIndexes: string[] = [];

  // Verify indexes for each critical table
  for (const [tableName, expectedIndexes] of Object.entries(EXPECTED_INDEXES)) {
    console.log(`\n📋 Verifying indexes for: ${tableName}`);
    console.log('─'.repeat(50));

    const indexes = await getTableIndexes(tableName);
    const indexNames = indexes.map(idx => idx.indexname);

    console.log(`   Found ${indexes.length} indexes`);

    // Check for missing indexes
    const missing = expectedIndexes.filter(exp => !indexNames.includes(exp));
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing ${missing.length} indexes:`);
      missing.forEach(idx => {
        console.log(`      - ${idx}`);
        missingIndexes.push(`${tableName}.${idx}`);
      });
    } else {
      console.log(`   ✅ All expected indexes present`);
    }

    totalIndexes += indexes.length;
  }

  // Display table statistics
  console.log('\n\n📊 DATABASE TABLE STATISTICS');
  console.log('=====================================\n');

  const stats = await getTableStats();
  console.log('Table Name'.padEnd(30) + 'Rows'.padEnd(15) + 'Total Size'.padEnd(15) + 'Index Size');
  console.log('─'.repeat(75));

  for (const stat of stats) {
    const tableName = stat.tablename.replace('public.', '');
    const rowCount = stat.row_count.toString();
    console.log(
      tableName.padEnd(30) +
      rowCount.padEnd(15) +
      stat.total_size.padEnd(15) +
      stat.index_size
    );
  }

  // Performance testing for key queries
  console.log('\n\n🚀 QUERY PERFORMANCE ANALYSIS');
  console.log('=====================================\n');

  // Test 1: User lookup by email
  await analyzeQuery(
    `SELECT * FROM "User" WHERE email = 'admin@zyphex.tech' AND "deletedAt" IS NULL`,
    'User lookup by email (login query)'
  );

  // Test 2: Projects by client and status
  await analyzeQuery(
    `SELECT * FROM "Project" WHERE "clientId" IN (SELECT id FROM "Client" LIMIT 1) AND status = 'IN_PROGRESS' AND "deletedAt" IS NULL`,
    'Projects by client and status'
  );

  // Test 3: User tasks by status and due date
  await analyzeQuery(
    `SELECT * FROM "Task" WHERE "assigneeId" IN (SELECT id FROM "User" LIMIT 1) AND status IN ('TODO', 'IN_PROGRESS') ORDER BY "dueDate" ASC LIMIT 20`,
    'User tasks by status with due date sorting'
  );

  // Test 4: Unread notifications
  await analyzeQuery(
    `SELECT * FROM "Notification" WHERE "userId" IN (SELECT id FROM "User" LIMIT 1) AND read = false ORDER BY "createdAt" DESC LIMIT 10`,
    'Unread notifications for user'
  );

  // Summary
  console.log('\n\n📈 VERIFICATION SUMMARY');
  console.log('=====================================\n');
  console.log(`✅ Total indexes verified: ${totalIndexes}`);
  console.log(`❌ Missing indexes: ${missingIndexes.length}`);

  if (missingIndexes.length > 0) {
    console.log('\n⚠️  Missing Indexes:');
    missingIndexes.forEach(idx => console.log(`   - ${idx}`));
    console.log('\n💡 Run "npx prisma migrate dev" to create missing indexes\n');
    process.exit(1);
  } else {
    console.log('\n✅ All indexes are properly configured!');
    console.log('🎉 Database is optimized for production performance!\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
