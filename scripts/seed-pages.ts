import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPages() {
  try {
    console.log('🌱 Seeding pages...')

    const defaultPages = [
      {
        slug: 'home',
        title: 'Home Page',
        description: 'The main landing page of the website',
        path: '/',
        isActive: true,
        isSystem: true,
        order: 1,
        metaTitle: 'ZyphexTech - IT Services & Solutions',
        metaDescription: 'Leading IT services agency providing web development, mobile apps, and digital transformation solutions.'
      },
      {
        slug: 'about',
        title: 'About Us',
        description: 'Information about the company and team',
        path: '/about',
        isActive: true,
        isSystem: true,
        order: 2,
        metaTitle: 'About ZyphexTech - Our Story & Mission',
        metaDescription: 'Learn about ZyphexTech\'s journey, mission, and the talented team behind our innovative IT solutions.'
      },
      {
        slug: 'services',
        title: 'Services',
        description: 'Overview of all services offered',
        path: '/services',
        isActive: true,
        isSystem: true,
        order: 3,
        metaTitle: 'IT Services - Web Development, Mobile Apps & More',
        metaDescription: 'Explore our comprehensive IT services including web development, mobile applications, cloud solutions, and digital transformation.'
      },
      {
        slug: 'portfolio',
        title: 'Portfolio',
        description: 'Showcase of completed projects and work',
        path: '/portfolio',
        isActive: true,
        isSystem: true,
        order: 4,
        metaTitle: 'Our Portfolio - Successful IT Projects & Case Studies',
        metaDescription: 'View our portfolio of successful IT projects, client success stories, and innovative solutions we\'ve delivered.'
      },
      {
        slug: 'blog',
        title: 'Blog',
        description: 'Latest news, insights, and technical articles',
        path: '/blog',
        isActive: true,
        isSystem: false,
        order: 5,
        metaTitle: 'Tech Blog - Insights, Tutorials & Industry News',
        metaDescription: 'Stay updated with the latest technology trends, development tutorials, and industry insights from our expert team.'
      },
      {
        slug: 'contact',
        title: 'Contact',
        description: 'Contact information and inquiry form',
        path: '/contact',
        isActive: true,
        isSystem: true,
        order: 6,
        metaTitle: 'Contact ZyphexTech - Get Your Project Started',
        metaDescription: 'Ready to start your next IT project? Contact ZyphexTech today for a free consultation and project quote.'
      }
    ]

    for (const pageData of defaultPages) {
      // Check if page already exists
      const existingPage = await prisma.page.findUnique({
        where: { slug: pageData.slug }
      })

      if (existingPage) {
        console.log(`📄 Page '${pageData.slug}' already exists, updating...`)
        await prisma.page.update({
          where: { slug: pageData.slug },
          data: {
            ...pageData,
            // Don't update createdAt for existing pages
          }
        })
      } else {
        console.log(`📄 Creating page '${pageData.slug}'...`)
        await prisma.page.create({
          data: pageData
        })
      }
    }

    console.log('✅ Pages seeded successfully!')

    // Show all pages
    const allPages = await prisma.page.findMany({
      orderBy: { order: 'asc' }
    })

    console.log('\n📋 All pages:')
    allPages.forEach(page => {
      console.log(`  - ${page.title} (/${page.slug}) ${page.isSystem ? '[System]' : ''}`)
    })

  } catch (error) {
    console.error('❌ Error seeding pages:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedPages()
    .then(() => {
      console.log('🎉 Seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

export default seedPages