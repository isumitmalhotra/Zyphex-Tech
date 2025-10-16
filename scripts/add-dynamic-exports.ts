/**
 * Script to add dynamic export to all API routes
 * This ensures no API routes try to render statically during build
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function addDynamicExportToRoutes() {
  // Find all route.ts files in app/api directory
  const routeFiles = glob.sync('app/api/**/route.ts', {
    cwd: projectRoot,
    absolute: true
  });

  console.log(`Found ${routeFiles.length} API route files\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const filePath of routeFiles) {
    try {
      let content = readFileSync(filePath, 'utf8');

      // Check if file already has dynamic export
      if (content.includes("export const dynamic = 'force-dynamic'") ||
          content.includes('export const dynamic = "force-dynamic"')) {
        console.log(`✓ Skipped (already has dynamic export): ${filePath.replace(projectRoot, '')}`);
        skippedCount++;
        continue;
      }

      // Find the first export function (GET, POST, PUT, DELETE, etc.)
      const exportFunctionMatch = content.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/);
      
      if (!exportFunctionMatch) {
        console.log(`? Skipped (no export function found): ${filePath.replace(projectRoot, '')}`);
        skippedCount++;
        continue;
      }

      const insertIndex = exportFunctionMatch.index;
      
      // Insert dynamic export before the first export function
      const before = content.substring(0, insertIndex);
      const after = content.substring(insertIndex);
      
      const dynamicExport = "// Force dynamic rendering for this API route\nexport const dynamic = 'force-dynamic'\n\n";
      
      content = before + dynamicExport + after;

      // Write the updated content
      writeFileSync(filePath, content, 'utf8');
      
      console.log(`✓ Updated: ${filePath.replace(projectRoot, '')}`);
      updatedCount++;
    } catch (error) {
      console.error(`✗ Error processing ${filePath}:`, error.message);
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Updated: ${updatedCount} files`);
  console.log(`   Skipped: ${skippedCount} files`);
  console.log(`   Total: ${routeFiles.length} files`);
}

addDynamicExportToRoutes().catch(console.error);
