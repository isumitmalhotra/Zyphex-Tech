import { PrismaClient } from '@prisma/client'
import { contentTypeTemplates } from '../lib/content-type-templates'

const prisma = new PrismaClient()

async function seedEnhancedContentTypes() {
  console.log('🌱 Seeding enhanced content types...')

  // Clear existing content types (optional - be careful in production)
  // await prisma.contentType.deleteMany({
  //   where: { isSystem: false }
  // })

  for (const template of contentTypeTemplates) {
    try {
      const existingContentType = await prisma.contentType.findUnique({
        where: { name: template.name }
      })

      if (existingContentType) {
        // Update existing content type with enhanced fields
        await prisma.contentType.update({
          where: { name: template.name },
          data: {
            label: template.label,
            description: template.description,
            icon: template.icon,
            fields: JSON.stringify(template.fields),
            settings: JSON.stringify(template.settings || {}),
            category: template.category,
            template: template.template,
            allowMultiple: template.allowMultiple ?? true,
            maxInstances: template.maxInstances,
            isActive: true,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Updated content type: ${template.label}`)
      } else {
        // Create new content type
        await prisma.contentType.create({
          data: {
            name: template.name,
            label: template.label,
            description: template.description,
            icon: template.icon,
            fields: JSON.stringify(template.fields),
            settings: JSON.stringify(template.settings || {}),
            category: template.category,
            template: template.template,
            isSystem: false,
            isActive: true,
            allowMultiple: template.allowMultiple ?? true,
            maxInstances: template.maxInstances
          }
        })
        console.log(`✅ Created content type: ${template.label}`)
      }
    } catch (error) {
      console.error(`❌ Error processing content type ${template.name}:`, error)
    }
  }

  // Create some sample content sections using the new content types
  const heroContentType = await prisma.contentType.findUnique({
    where: { name: 'hero_section' }
  })

  if (heroContentType) {
    try {
      await prisma.dynamicContentSection.upsert({
        where: { sectionKey: 'homepage-hero' },
        update: {
          title: 'Homepage Hero Section',
          subtitle: 'Main banner for the homepage',
          description: 'Welcome to our amazing platform',
          layoutSettings: JSON.stringify({
            theme: 'dark',
            background: 'gradient',
            alignment: 'center',
            padding: 'large'
          })
        },
        create: {
          contentTypeId: heroContentType.id,
          sectionKey: 'homepage-hero',
          title: 'Homepage Hero Section',
          subtitle: 'Main banner for the homepage', 
          description: 'Welcome to our amazing platform',
          layoutSettings: JSON.stringify({
            theme: 'dark',
            background: 'gradient',
            alignment: 'center',
            padding: 'large'
          }),
          isActive: true,
          order: 0
        }
      })
      console.log('✅ Created/updated homepage hero section')
    } catch (error) {
      console.error('❌ Error creating hero section:', error)
    }
  }

  // Create sample content items for the advanced form
  const advancedFormType = await prisma.contentType.findUnique({
    where: { name: 'advanced_form' }
  })

  if (advancedFormType) {
    try {
      await prisma.dynamicContentItem.upsert({
        where: { 
          contentTypeId_slug: {
            contentTypeId: advancedFormType.id,
            slug: 'contact-form'
          }
        },
        update: {
          title: 'Contact Form',
          data: JSON.stringify({
            title: 'Get in Touch',
            description: '<p>We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.</p>',
            email: 'contact@zyphextech.com',
            phone: '+1 (555) 123-4567',
            price: 0.00,
            priority: 'medium',
            categories: ['business', 'tech'],
            isActive: true,
            publishDate: new Date().toISOString(),
            brandColor: '#3b82f6',
            tags: ['contact', 'form', 'support'],
            metadata: {
              formId: 'contact-form-v1',
              version: '1.0'
            }
          }),
          status: 'published',
          publishedAt: new Date()
        },
        create: {
          contentTypeId: advancedFormType.id,
          slug: 'contact-form',
          title: 'Contact Form',
          data: JSON.stringify({
            title: 'Get in Touch',
            description: '<p>We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.</p>',
            email: 'contact@zyphextech.com',
            phone: '+1 (555) 123-4567',
            price: 0.00,
            priority: 'medium',
            categories: ['business', 'tech'],
            isActive: true,
            publishDate: new Date().toISOString(),
            brandColor: '#3b82f6',
            tags: ['contact', 'form', 'support'],
            metadata: {
              formId: 'contact-form-v1',
              version: '1.0'
            }
          }),
          status: 'published',
          publishedAt: new Date(),
          featured: false,
          order: 0
        }
      })
      console.log('✅ Created/updated sample contact form content')
    } catch (error) {
      console.error('❌ Error creating contact form content:', error)
    }
  }

  console.log('🎉 Enhanced content types seeding completed!')
}

async function main() {
  try {
    await seedEnhancedContentTypes()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

export default main