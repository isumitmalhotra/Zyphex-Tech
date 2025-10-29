#!/usr/bin/env tsx
/**
 * Lighthouse Performance Audit Script
 * Runs Lighthouse audits on key pages and generates performance reports
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditResult {
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  metrics: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    tti: number; // Time to Interactive
    si: number; // Speed Index
    tbt: number; // Total Blocking Time
    cls: number; // Cumulative Layout Shift
  };
}

// Pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Homepage', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Super Admin Projects', path: '/super-admin/projects' },
  { name: 'Super Admin Clients', path: '/super-admin/clients' },
  { name: 'Super Admin Tasks', path: '/super-admin/tasks' },
  { name: 'Super Admin Users', path: '/super-admin/users' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Contact', path: '/contact' },
];

const BASE_URL = process.env.AUDIT_URL || 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'lighthouse-reports');

// Lighthouse configuration
const CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

async function runLighthouse(url: string): Promise<any> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options, CONFIG);
    await chrome.kill();
    return runnerResult;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

function extractMetrics(lhr: any): AuditResult['metrics'] {
  const audits = lhr.audits;
  return {
    fcp: audits['first-contentful-paint']?.numericValue || 0,
    lcp: audits['largest-contentful-paint']?.numericValue || 0,
    tti: audits['interactive']?.numericValue || 0,
    si: audits['speed-index']?.numericValue || 0,
    tbt: audits['total-blocking-time']?.numericValue || 0,
    cls: audits['cumulative-layout-shift']?.numericValue || 0,
  };
}

function formatMetric(value: number, type: 'time' | 'cls'): string {
  if (type === 'time') {
    return `${(value / 1000).toFixed(2)}s`;
  }
  return value.toFixed(3);
}

function getScoreColor(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

async function auditPage(name: string, path: string): Promise<AuditResult> {
  const url = `${BASE_URL}${path}`;
  console.log(`\n🔍 Auditing: ${name} (${url})`);

  try {
    const result = await runLighthouse(url);
    const lhr = result.lhr;

    const auditResult: AuditResult = {
      url,
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
      pwa: Math.round((lhr.categories.pwa?.score || 0) * 100),
      metrics: extractMetrics(lhr),
    };

    // Print results
    console.log(`  ${getScoreColor(auditResult.performance)} Performance: ${auditResult.performance}`);
    console.log(`  ${getScoreColor(auditResult.accessibility)} Accessibility: ${auditResult.accessibility}`);
    console.log(`  ${getScoreColor(auditResult.bestPractices)} Best Practices: ${auditResult.bestPractices}`);
    console.log(`  ${getScoreColor(auditResult.seo)} SEO: ${auditResult.seo}`);
    console.log(`  📊 Metrics:`);
    console.log(`     FCP: ${formatMetric(auditResult.metrics.fcp, 'time')}`);
    console.log(`     LCP: ${formatMetric(auditResult.metrics.lcp, 'time')}`);
    console.log(`     TTI: ${formatMetric(auditResult.metrics.tti, 'time')}`);
    console.log(`     SI: ${formatMetric(auditResult.metrics.si, 'time')}`);
    console.log(`     TBT: ${formatMetric(auditResult.metrics.tbt, 'time')}`);
    console.log(`     CLS: ${formatMetric(auditResult.metrics.cls, 'cls')}`);

    // Save full report
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const reportPath = join(OUTPUT_DIR, `${name.toLowerCase().replace(/\s+/g, '-')}.json`);
    writeFileSync(reportPath, JSON.stringify(result.lhr, null, 2));
    console.log(`  💾 Full report saved: ${reportPath}`);

    return auditResult;
  } catch (error) {
    console.error(`  ❌ Failed to audit ${name}:`, error);
    throw error;
  }
}

function generateSummaryReport(results: AuditResult[]): string {
  const avgPerformance = results.reduce((sum, r) => sum + r.performance, 0) / results.length;
  const avgAccessibility = results.reduce((sum, r) => sum + r.accessibility, 0) / results.length;
  const avgBestPractices = results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length;
  const avgSeo = results.reduce((sum, r) => sum + r.seo, 0) / results.length;

  let report = `
# Lighthouse Performance Audit Report
**Date:** ${new Date().toISOString().split('T')[0]}
**Base URL:** ${BASE_URL}

## Summary

| Category | Average Score | Status |
|----------|--------------|--------|
| Performance | ${avgPerformance.toFixed(1)} | ${getScoreColor(avgPerformance)} |
| Accessibility | ${avgAccessibility.toFixed(1)} | ${getScoreColor(avgAccessibility)} |
| Best Practices | ${avgBestPractices.toFixed(1)} | ${getScoreColor(avgBestPractices)} |
| SEO | ${avgSeo.toFixed(1)} | ${getScoreColor(avgSeo)} |

## Individual Page Results

| Page | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TTI |
|------|-------------|---------------|----------------|-----|-----|-----|-----|
`;

  results.forEach((result, index) => {
    const pageName = PAGES_TO_AUDIT[index].name;
    report += `| ${pageName} | ${result.performance} ${getScoreColor(result.performance)} | ${result.accessibility} | ${result.bestPractices} | ${result.seo} | ${formatMetric(result.metrics.fcp, 'time')} | ${formatMetric(result.metrics.lcp, 'time')} | ${formatMetric(result.metrics.tti, 'time')} |\n`;
  });

  report += `\n## Recommendations

### Performance Targets
- ✅ Performance Score: > 90
- ✅ Accessibility Score: > 90
- ✅ Best Practices Score: > 90
- ✅ SEO Score: > 90

### Core Web Vitals Targets
- ✅ FCP (First Contentful Paint): < 1.8s
- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ TTI (Time to Interactive): < 3.8s
- ✅ CLS (Cumulative Layout Shift): < 0.1

### Optimization Suggestions
${avgPerformance < 90 ? '- ⚠️ Performance needs improvement. Consider code splitting, lazy loading, and image optimization.' : '- ✅ Performance is good!'}
${avgAccessibility < 90 ? '- ⚠️ Accessibility needs improvement. Add ARIA labels, improve contrast, and ensure keyboard navigation.' : '- ✅ Accessibility is good!'}
${avgBestPractices < 90 ? '- ⚠️ Best Practices need improvement. Review security headers, HTTPS usage, and console errors.' : '- ✅ Best Practices are good!'}
${avgSeo < 90 ? '- ⚠️ SEO needs improvement. Add meta descriptions, improve heading structure, and ensure mobile-friendliness.' : '- ✅ SEO is good!'}

## Detailed Reports
Full JSON reports are saved in: \`${OUTPUT_DIR}\`
`;

  return report;
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Audit');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📝 Auditing ${PAGES_TO_AUDIT.length} pages...\n`);

  const results: AuditResult[] = [];

  // Run audits sequentially to avoid overwhelming the system
  for (const page of PAGES_TO_AUDIT) {
    try {
      const result = await auditPage(page.name, page.path);
      results.push(result);
    } catch (error) {
      console.error(`Failed to audit ${page.name}, skipping...`);
    }
  }

  // Generate summary report
  console.log('\n\n📊 Generating Summary Report...');
  const summaryReport = generateSummaryReport(results);
  
  // Save summary
  const summaryPath = join(OUTPUT_DIR, 'LIGHTHOUSE_SUMMARY.md');
  writeFileSync(summaryPath, summaryReport);
  
  console.log(`\n✅ Audit Complete!`);
  console.log(`📄 Summary Report: ${summaryPath}`);
  console.log(`📁 Detailed Reports: ${OUTPUT_DIR}`);

  // Print summary to console
  console.log('\n' + summaryReport);
}

// Run the audit
main().catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
