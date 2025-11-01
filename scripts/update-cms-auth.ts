/**
 * Script to update all CMS API routes to use super-admin only
 * Run with: npx tsx scripts/update-cms-auth.ts
 */

import * as fs from 'fs'
import * as path from 'path'

function findTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList)
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Patterns to find and replace
const replacements = [
  {
    // Pattern 1: ['admin', 'super-admin'] to super-admin only
    find: /!session \|\| !(\['admin',\s*'super-admin'\]|(\['super-admin',\s*'admin'\]))\.includes\(session\.user\?\.role \|\| ''\)/g,
    replace: "!session || session.user?.role !== 'super-admin'"
  },
  {
    // Pattern 2: Update error messages
    find: /Unauthorized - Admin access required/g,
    replace: 'Unauthorized - Super Admin access required'
  },
  {
    // Pattern 3: Role check in code
    find: /(\['admin',\s*'super[_-]admin'(,\s*'[^']*')*\]|(\['super[_-]admin',\s*'admin'(,\s*'[^']*')*\]))\.includes\((\w+)\)/g,
    replace: "$5 === 'super-admin'"
  },
  {
    // Pattern 4: role !== 'admin' && role !== 'super_admin'
    find: /role\s*!==\s*'admin'\s*&&\s*role\s*!==\s*'super[_-]admin'/g,
    replace: "role !== 'super-admin'"
  },
  {
    // Pattern 5: Clean up any remaining admin references in role checks
    find: /'admin',\s*'super[_-]admin',/g,
    replace: "'super-admin',"
  },
  {
    // Pattern 6: Standalone admin role checks
    find: /userRole\s*===\s*'admin'/g,
    replace: "userRole === 'super-admin'"
  }
]

async function updateFile(filePath: string) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false

    for (const { find, replace } of replacements) {
      if (find.test(content)) {
        content = content.replace(find, replace)
        modified = true
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error)
    return false
  }
}

async function main() {
  console.log('🔍 Finding CMS API routes...\n')

  const cmsApiDir = path.join(process.cwd(), 'app', 'api', 'cms')
  
  if (!fs.existsSync(cmsApiDir)) {
    console.error('❌ CMS API directory not found')
    return
  }

  // Find all TypeScript files in CMS API directory
  const files = findTsFiles(cmsApiDir)

  console.log(`📁 Found ${files.length} files\n`)

  let updatedCount = 0

  for (const file of files) {
    const updated = await updateFile(file)
    if (updated) {
      updatedCount++
    }
  }

  console.log(`\n✨ Complete! Updated ${updatedCount} files`)
  console.log('\n📝 Summary:')
  console.log('   - Removed "admin" role from all CMS routes')
  console.log('   - Only "super-admin" role can access CMS')
  console.log('   - Updated all error messages')
}

main().catch(console.error)
