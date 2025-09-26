import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMediaAssets() {
  console.log('🌱 Seeding sample media assets...')

  // Create some sample media assets (these would normally be uploaded files)
  const sampleMediaAssets = [
    {
      filename: 'hero-image.jpg',
      originalName: 'hero-background.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      url: '/placeholder.jpg',
      alt: 'Hero background image',
      category: 'content'
    },
    {
      filename: 'logo-main.png',
      originalName: 'company-logo.png',
      mimeType: 'image/png',
      size: 45600,
      url: '/zyphex-logo.png',
      alt: 'Zyphex Tech Logo',
      category: 'image'
    },
    {
      filename: 'portfolio-1.jpg',
      originalName: 'project-showcase-1.jpg',
      mimeType: 'image/jpeg',
      size: 876543,
      url: '/placeholder.jpg',
      alt: 'Portfolio project showcase',
      category: 'portfolio'
    },
    {
      filename: 'blog-cover.jpg',
      originalName: 'blog-post-cover.jpg',
      mimeType: 'image/jpeg',
      size: 654321,
      url: '/placeholder.jpg',
      alt: 'Blog post cover image',
      category: 'blog'
    },
    {
      filename: 'user-avatar.png',
      originalName: 'default-user-avatar.png',
      mimeType: 'image/png',
      size: 32768,
      url: '/placeholder-user.jpg',
      alt: 'Default user avatar',
      category: 'content'
    }
  ]

  for (const asset of sampleMediaAssets) {
    try {
      const created = await prisma.mediaAsset.create({
        data: asset
      })
      console.log(`✅ Created media asset: ${created.originalName}`)
    } catch (error) {
      console.log(`⚠️  Media asset already exists or error: ${asset.originalName}`)
    }
  }

  console.log('✅ Sample media assets seeded successfully!')
}

// Run the seed function
seedMediaAssets()
  .catch((e) => {
    console.error('❌ Error seeding media assets:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })