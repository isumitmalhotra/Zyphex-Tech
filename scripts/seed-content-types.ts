import { PrismaClient } from '@prisma/client'
import { DEFAULT_CONTENT_TYPES } from '../types/content'

const prisma = new PrismaClient()

async function seedContentTypes() {
  console.log('🌱 Seeding content types...')

  try {
    // Create default content types
    for (const contentTypeData of DEFAULT_CONTENT_TYPES) {
      const existingType = await prisma.contentType.findUnique({
        where: { name: contentTypeData.name! }
      }).catch(() => null)

      if (!existingType) {
        await prisma.contentType.create({
          data: {
            name: contentTypeData.name!,
            label: contentTypeData.label!,
            description: contentTypeData.description || '',
            icon: contentTypeData.icon || '',
            fields: JSON.stringify(contentTypeData.fields),
            settings: JSON.stringify(contentTypeData.settings),
            isSystem: true, // Mark as system-defined content types
            isActive: true
          }
        })
        console.log(`✅ Created content type: ${contentTypeData.label}`)
      } else {
        console.log(`⏭️  Content type already exists: ${contentTypeData.label}`)
      }
    }

    console.log('🎉 Content types seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding content types:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedContentTypes()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}

export default seedContentTypes