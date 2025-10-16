import * as fs from 'fs';
import * as glob from 'glob';

// Find all page.tsx files except those in node_modules
const pageFiles = glob.sync('app/**/page.tsx', {
  ignore: ['node_modules/**', '.next/**'],
});

console.log(`Found ${pageFiles.length} page files`);

let updated = 0;
let skipped = 0;

for (const file of pageFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Skip if already has dynamic export
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`✓ Skipped (already has dynamic): ${file}`);
    skipped++;
    continue;
  }
  
  // Skip if it's a client component (has "use client")
  if (content.includes('"use client"') || content.includes("'use client'")) {
    console.log(`✓ Skipped (client component): ${file}`);
    skipped++;
    continue;
  }
  
  // Add dynamic export at the top of the file (after imports usually)
  // Look for first export default or first export function
  let newContent: string;
  
  // Check if file has default export function
  const defaultExportMatch = content.match(/export default (function|async function)/);
  if (defaultExportMatch) {
    // Add before the export default
    newContent = content.replace(
      /export default (function|async function)/,
      `export const dynamic = 'force-dynamic';\n\nexport default $1`
    );
  } else {
    // Otherwise, add at the very top (after any imports)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{') || 
          lines[i].trim().startsWith('import*') || lines[i].trim().startsWith('import type')) {
        insertIndex = i + 1;
      }
    }
    
    // If no imports found, check for 'use client' or 'use server'
    if (insertIndex === 0) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('use client') || lines[i].includes('use server')) {
          insertIndex = i + 1;
          break;
        }
      }
    }
    
    // Insert the dynamic export
    lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic';", '');
    newContent = lines.join('\n');
  }
  
  fs.writeFileSync(file, newContent);
  console.log(`✓ Updated: ${file}`);
  updated++;
}

console.log(`\n✅ Complete!`);
console.log(`   Updated: ${updated}`);
console.log(`   Skipped: ${skipped}`);
console.log(`   Total: ${pageFiles.length}`);
