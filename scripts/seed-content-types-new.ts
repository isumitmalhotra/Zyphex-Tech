import { prisma } from '../lib/prisma'
import { contentTypeTemplates } from '../lib/content-type-templates'

async function seedContentTypes() {
  try {
    console.log('Seeding content types from templates...')

    // Check if any content types already exist
    const existingCount = await prisma.contentType.count()
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing content types. Skipping seed.`)
      return
    }

    // Create system content types from templates
    const systemTemplates = contentTypeTemplates.slice(0, 3) // First 3 as system types

    for (const template of systemTemplates) {
      const contentType = await prisma.contentType.create({
        data: {
          name: template.name,
          label: template.label,
          description: template.description,
          icon: template.icon,
          fields: JSON.stringify(template.fields),
          settings: JSON.stringify(template.settings),
          isSystem: true,
          isActive: true
        }
      })

      console.log(`Created system content type: ${contentType.label}`)
    }

    // Create some example content types (non-system)
    const exampleTemplates = contentTypeTemplates.slice(3, 5) // Next 2 as examples

    for (const template of exampleTemplates) {
      const contentType = await prisma.contentType.create({
        data: {
          name: template.name,
          label: template.label,
          description: template.description,
          icon: template.icon,
          fields: JSON.stringify(template.fields),
          settings: JSON.stringify(template.settings),
          isSystem: false,
          isActive: true
        }
      })

      console.log(`Created example content type: ${contentType.label}`)
    }

    console.log('Content types seeded successfully!')

  } catch (error) {
    console.error('Error seeding content types:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedContentTypes()