import { prisma } from '../lib/prisma'

async function testContentTypes() {
  try {
    console.log('Testing ContentType model...')
    
    // Test creating a content type
    const contentType = await prisma.contentType.create({
      data: {
        name: 'hero',
        label: 'Hero Section',
        description: 'A hero section with title, subtitle, and background image',
        fields: JSON.stringify([
          {
            id: 'title',
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            order: 0
          },
          {
            id: 'subtitle',
            name: 'subtitle', 
            label: 'Subtitle',
            type: 'textarea',
            required: false,
            order: 1
          },
          {
            id: 'backgroundImage',
            name: 'backgroundImage',
            label: 'Background Image',
            type: 'image',
            required: false,
            order: 2
          }
        ]),
        settings: JSON.stringify({
          hasSlug: false,
          hasStatus: false,
          hasPublishing: false,
          hasOrdering: true
        })
      }
    })
    
    console.log('Created content type:', contentType)
    
    // Test fetching all content types
    const contentTypes = await prisma.contentType.findMany()
    console.log('All content types:', contentTypes.length)
    
    // Clean up
    await prisma.contentType.delete({
      where: { id: contentType.id }
    })
    
    console.log('Test completed successfully!')
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testContentTypes()