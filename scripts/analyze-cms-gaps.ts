/**
 * Comprehensive CMS Gap Analysis
 * Identifies all issues between UI components and backend APIs
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface GapIssue {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  component: string;
  issue: string;
  expected: string;
  actual: string;
  fix: string;
}

const issues: GapIssue[] = [];

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function analyzeRoutingIssues() {
  console.log('\n📍 Analyzing Routing Issues...\n');

  // Check pages-list.tsx routing
  const pagesListPath = path.join(process.cwd(), 'components/cms/pages-list.tsx');
  const pagesListContent = await fs.readFile(pagesListPath, 'utf-8');

  if (pagesListContent.includes('/admin/cms/pages/')) {
    if (!pagesListContent.includes('/super-admin/cms/pages/')) {
      issues.push({
        category: 'Routing',
        severity: 'CRITICAL',
        component: 'components/cms/pages-list.tsx',
        issue: 'Hardcoded /admin paths',
        expected: 'Dynamic routing based on current path (admin or super-admin)',
        actual: 'All routes point to /admin even when on /super-admin',
        fix: 'Use usePathname() to detect current path and route accordingly'
      });
    }
  }

  // Check template-list.tsx
  const templateListPath = path.join(process.cwd(), 'components/cms/template-list.tsx');
  if (await checkFileExists(templateListPath)) {
    const templateContent = await fs.readFile(templateListPath, 'utf-8');
    if (templateContent.includes('/admin/cms/templates/') && !templateContent.includes('usePathname')) {
      issues.push({
        category: 'Routing',
        severity: 'CRITICAL',
        component: 'components/cms/template-list.tsx',
        issue: 'Hardcoded /admin paths',
        expected: 'Dynamic routing',
        actual: 'Fixed /admin paths',
        fix: 'Implement dynamic path detection'
      });
    }
  }

  console.log(`   Found ${issues.filter(i => i.category === 'Routing').length} routing issues`);
}

async function analyzeAPIEndpoints() {
  console.log('\n🔌 Analyzing API Endpoints...\n');

  const apiChecks = [
    { path: 'app/api/cms/pages/route.ts', endpoint: '/api/cms/pages', method: 'GET' },
    { path: 'app/api/cms/pages/route.ts', endpoint: '/api/cms/pages', method: 'POST' },
    { path: 'app/api/cms/pages/[id]/route.ts', endpoint: '/api/cms/pages/:id', method: 'GET' },
    { path: 'app/api/cms/pages/[id]/route.ts', endpoint: '/api/cms/pages/:id', method: 'PUT' },
    { path: 'app/api/cms/pages/[id]/route.ts', endpoint: '/api/cms/pages/:id', method: 'DELETE' },
    { path: 'app/api/cms/pages/[id]/duplicate/route.ts', endpoint: '/api/cms/pages/:id/duplicate', method: 'POST' },
    { path: 'app/api/cms/templates/route.ts', endpoint: '/api/cms/templates', method: 'GET' },
    { path: 'app/api/cms/media/route.ts', endpoint: '/api/cms/media', method: 'GET' },
    { path: 'app/api/cms/media/route.ts', endpoint: '/api/cms/media', method: 'POST' },
    { path: 'app/api/cms/media/[id]/route.ts', endpoint: '/api/cms/media/:id', method: 'DELETE' },
    { path: 'app/api/cms/analytics/route.ts', endpoint: '/api/cms/analytics', method: 'GET' },
    { path: 'app/api/cms/settings/route.ts', endpoint: '/api/cms/settings', method: 'GET' },
  ];

  for (const check of apiChecks) {
    const exists = await checkFileExists(path.join(process.cwd(), check.path));
    if (!exists) {
      issues.push({
        category: 'API',
        severity: 'CRITICAL',
        component: check.path,
        issue: 'Missing API endpoint',
        expected: `${check.method} ${check.endpoint} should exist`,
        actual: 'File not found',
        fix: `Create ${check.path} with ${check.method} handler`
      });
    } else {
      const content = await fs.readFile(path.join(process.cwd(), check.path), 'utf-8');
      if (!content.includes(`export async function ${check.method}`)) {
        issues.push({
          category: 'API',
          severity: 'HIGH',
          component: check.path,
          issue: `Missing ${check.method} handler`,
          expected: `export async function ${check.method}`,
          actual: 'Handler not found in file',
          fix: `Add ${check.method} handler to ${check.path}`
        });
      }
    }
  }

  console.log(`   Found ${issues.filter(i => i.category === 'API').length} API issues`);
}

async function analyzeDatabaseModels() {
  console.log('\n💾 Analyzing Database Models...\n');

  try {
    // Check CmsPage
    const cmsPageCount = await prisma.cmsPage.count();
    console.log(`   CmsPage: ${cmsPageCount} records`);

    if (cmsPageCount === 0) {
      issues.push({
        category: 'Database',
        severity: 'MEDIUM',
        component: 'CmsPage model',
        issue: 'No CMS pages in database',
        expected: 'At least some seed data',
        actual: '0 records',
        fix: 'Run: npx tsx scripts/seed-cms-pages.ts'
      });
    }

    // Check CmsTemplate
    const templateCount = await prisma.cmsTemplate.count();
    console.log(`   CmsTemplate: ${templateCount} records`);

    if (templateCount === 0) {
      issues.push({
        category: 'Database',
        severity: 'HIGH',
        component: 'CmsTemplate model',
        issue: 'No templates in database',
        expected: 'At least 1-2 basic templates',
        actual: '0 records',
        fix: 'Create seed script: scripts/seed-cms-templates.ts'
      });
    }

    // Check CmsMediaAsset vs MediaAsset
    const cmsMediaCount = await prisma.cmsMediaAsset.count();
    const mediaAssetCount = await prisma.mediaAsset.count();
    console.log(`   CmsMediaAsset: ${cmsMediaCount} records`);
    console.log(`   MediaAsset: ${mediaAssetCount} records`);

    if (cmsMediaCount === 0 && mediaAssetCount > 0) {
      issues.push({
        category: 'Database',
        severity: 'HIGH',
        component: 'Media models',
        issue: 'Using wrong media model',
        expected: 'CmsMediaAsset should have records',
        actual: `CmsMediaAsset: ${cmsMediaCount}, MediaAsset: ${mediaAssetCount}`,
        fix: 'API should query CmsMediaAsset, not MediaAsset - or migrate data'
      });
    }

  } catch (error: any) {
    issues.push({
      category: 'Database',
      severity: 'CRITICAL',
      component: 'Prisma Client',
      issue: 'Database query failed',
      expected: 'Successful queries',
      actual: error.message,
      fix: 'Check database connection and schema'
    });
  }
}

async function analyzeComponents() {
  console.log('\n🧩 Analyzing Components...\n');

  const components = [
    'components/cms/pages-list.tsx',
    'components/cms/template-list.tsx',
    'components/cms/media-library.tsx',
    'components/cms/page-editor.tsx',
    'components/cms/usage-info.tsx'
  ];

  for (const comp of components) {
    const exists = await checkFileExists(path.join(process.cwd(), comp));
    if (!exists) {
      issues.push({
        category: 'Components',
        severity: 'HIGH',
        component: comp,
        issue: 'Component file missing',
        expected: 'Component should exist',
        actual: 'File not found',
        fix: `Create ${comp}`
      });
    }
  }

  console.log(`   Found ${issues.filter(i => i.category === 'Components').length} component issues`);
}

async function analyzePageEditorRoute() {
  console.log('\n📝 Analyzing Page Editor Routes...\n');

  const editorRoutes = [
    'app/admin/cms/pages/[id]/edit/page.tsx',
    'app/super-admin/cms/pages/[id]/edit/page.tsx',
    'app/admin/cms/pages/new/page.tsx',
    'app/super-admin/cms/pages/new/page.tsx'
  ];

  for (const route of editorRoutes) {
    const exists = await checkFileExists(path.join(process.cwd(), route));
    if (!exists) {
      issues.push({
        category: 'Routes',
        severity: 'CRITICAL',
        component: route,
        issue: 'Editor route missing',
        expected: 'Page editor should exist',
        actual: 'File not found',
        fix: `Create ${route} with page editor component`
      });
    } else {
      // Check if it has proper editor component
      const content = await fs.readFile(path.join(process.cwd(), route), 'utf-8');
      if (!content.includes('PageEditor') && !content.includes('CmsPageEditor')) {
        issues.push({
          category: 'Routes',
          severity: 'HIGH',
          component: route,
          issue: 'No editor component in route',
          expected: 'Should render PageEditor or CmsPageEditor',
          actual: 'No editor component found',
          fix: 'Add PageEditor component to route'
        });
      }
    }
  }

  console.log(`   Found ${issues.filter(i => i.category === 'Routes').length} route issues`);
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CMS GAP ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const highIssues = issues.filter(i => i.severity === 'HIGH');
  const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
  const lowIssues = issues.filter(i => i.severity === 'LOW');

  console.log(`🔴 CRITICAL: ${criticalIssues.length}`);
  console.log(`🟠 HIGH: ${highIssues.length}`);
  console.log(`🟡 MEDIUM: ${mediumIssues.length}`);
  console.log(`🟢 LOW: ${lowIssues.length}`);
  console.log(`\n📋 TOTAL ISSUES: ${issues.length}\n`);

  console.log('='.repeat(80));
  console.log('🔴 CRITICAL ISSUES (Must Fix Immediately)');
  console.log('='.repeat(80) + '\n');

  criticalIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.category}] ${issue.component}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Expected: ${issue.expected}`);
    console.log(`   Actual: ${issue.actual}`);
    console.log(`   ✅ Fix: ${issue.fix}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('🟠 HIGH PRIORITY ISSUES');
  console.log('='.repeat(80) + '\n');

  highIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.category}] ${issue.component}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   ✅ Fix: ${issue.fix}`);
    console.log('');
  });

  // Save report to file
  const reportPath = path.join(process.cwd(), 'CMS_GAP_ANALYSIS_REPORT.md');
  let markdown = `# CMS Gap Analysis Report\n\n`;
  markdown += `**Generated**: ${new Date().toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- 🔴 **CRITICAL**: ${criticalIssues.length}\n`;
  markdown += `- 🟠 **HIGH**: ${highIssues.length}\n`;
  markdown += `- 🟡 **MEDIUM**: ${mediumIssues.length}\n`;
  markdown += `- 🟢 **LOW**: ${lowIssues.length}\n`;
  markdown += `\n**Total Issues**: ${issues.length}\n\n`;

  markdown += `---\n\n## 🔴 Critical Issues\n\n`;
  criticalIssues.forEach((issue, index) => {
    markdown += `### ${index + 1}. ${issue.component}\n\n`;
    markdown += `**Category**: ${issue.category}\n\n`;
    markdown += `**Issue**: ${issue.issue}\n\n`;
    markdown += `**Expected**: ${issue.expected}\n\n`;
    markdown += `**Actual**: ${issue.actual}\n\n`;
    markdown += `**Fix**: ${issue.fix}\n\n`;
    markdown += `---\n\n`;
  });

  markdown += `## 🟠 High Priority Issues\n\n`;
  highIssues.forEach((issue, index) => {
    markdown += `### ${index + 1}. ${issue.component}\n\n`;
    markdown += `**Issue**: ${issue.issue}\n\n`;
    markdown += `**Fix**: ${issue.fix}\n\n`;
    markdown += `---\n\n`;
  });

  markdown += `## 🟡 Medium Priority Issues\n\n`;
  mediumIssues.forEach((issue, index) => {
    markdown += `### ${index + 1}. ${issue.component}\n\n`;
    markdown += `**Issue**: ${issue.issue}\n\n`;
    markdown += `**Fix**: ${issue.fix}\n\n`;
    markdown += `---\n\n`;
  });

  await fs.writeFile(reportPath, markdown);
  console.log(`\n✅ Full report saved to: CMS_GAP_ANALYSIS_REPORT.md\n`);
}

async function main() {
  console.log('🔍 Starting Comprehensive CMS Gap Analysis...\n');

  try {
    await analyzeRoutingIssues();
    await analyzeAPIEndpoints();
    await analyzeDatabaseModels();
    await analyzeComponents();
    await analyzePageEditorRoute();
    await generateReport();
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
