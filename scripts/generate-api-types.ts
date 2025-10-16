#!/usr/bin/env node
/**
 * CLI Script to Generate TypeScript Types from OpenAPI Spec
 * 
 * Usage:
 *   npm run generate-types
 *   node scripts/generate-api-types.ts
 */

import fs from 'fs';
import path from 'path';
import { generateOpenAPISpec } from '../lib/api/openapi/generator';
import { generateTypes } from '../lib/api/openapi/type-generator';

const OUTPUT_FILE = path.join(process.cwd(), 'types', 'api.generated.ts');

async function main() {
  console.log('🚀 Generating TypeScript types from OpenAPI spec...\n');
  
  try {
    // Generate OpenAPI spec
    console.log('📝 Generating OpenAPI specification...');
    const spec = generateOpenAPISpec({
      title: 'Zyphex Tech API',
      version: '1.0.0',
      description: 'IT Services Agency Platform API'
    });
    console.log('✅ OpenAPI spec generated\n');
    
    // Generate TypeScript types
    console.log('🔧 Generating TypeScript types...');
    const types = generateTypes(spec, {
      includeComments: true,
      useInterfaces: false,
      exportAll: true,
      typePrefix: '',
      typeSuffix: ''
    });
    console.log('✅ TypeScript types generated\n');
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      console.log(`📁 Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    console.log(`💾 Writing to: ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, types, 'utf-8');
    console.log('✅ File written successfully\n');
    
    // Stats
    const lines = types.split('\n').length;
    const size = Buffer.byteLength(types, 'utf-8');
    console.log('📊 Stats:');
    console.log(`   - Lines: ${lines}`);
    console.log(`   - Size: ${(size / 1024).toFixed(2)} KB`);
    console.log(`   - Types: ${spec.components?.schemas ? Object.keys(spec.components.schemas).length : 0}`);
    console.log('');
    
    console.log('✨ Done! Types generated successfully.');
    console.log(`📄 Output: ${OUTPUT_FILE}\n`);
    
  } catch (error) {
    console.error('❌ Error generating types:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
