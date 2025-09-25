import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleMediaAssets() {
  console.log('Creating sample media assets...')

  const sampleMediaAssets = [
    {
      filename: 'hero-bg.jpg',
      originalName: 'hero-background.jpg',
      mimeType: 'image/jpeg',
      size: 2048000,
      url: '/images/hero-bg.jpg',
      alt: 'Hero background image showcasing modern technology',
      category: 'hero',
    },
    {
      filename: 'team-photo.jpg',
      originalName: 'leadership-team.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      url: '/images/team-photo.jpg',
      alt: 'ZyphexTech leadership team',
      category: 'team',
    },
    {
      filename: 'zyphex-logo.png',
      originalName: 'company-logo.png',
      mimeType: 'image/png',
      size: 256000,
      url: '/zyphex-logo.png',
      alt: 'ZyphexTech company logo',
      category: 'branding',
    },
    {
      filename: 'services-illustration.svg',
      originalName: 'services-graphic.svg',
      mimeType: 'image/svg+xml',
      size: 128000,
      url: '/images/services-illustration.svg',
      alt: 'Services illustration graphic',
      category: 'services',
    },
    {
      filename: 'portfolio-ecommerce.jpg',
      originalName: 'ecommerce-project.jpg',
      mimeType: 'image/jpeg',
      size: 1536000,
      url: '/images/portfolio/ecommerce-project.jpg',
      alt: 'E-commerce platform project showcase',
      category: 'portfolio',
    },
    {
      filename: 'blog-ai-trends.jpg',
      originalName: 'ai-trends-cover.jpg',
      mimeType: 'image/jpeg',
      size: 1200000,
      url: '/images/blog/ai-trends-cover.jpg',
      alt: 'AI trends blog post cover image',
      category: 'blog',
    },
    {
      filename: 'presentation.pdf',
      originalName: 'company-presentation.pdf',
      mimeType: 'application/pdf',
      size: 5242880,
      url: '/documents/company-presentation.pdf',
      alt: 'Company presentation document',
      category: 'documents',
    },
    {
      filename: 'demo-video.mp4',
      originalName: 'product-demo.mp4',
      mimeType: 'video/mp4',
      size: 15728640,
      url: '/videos/product-demo.mp4',
      alt: 'Product demonstration video',
      category: 'videos',
    }
  ]

  try {
    // Get an admin user to assign as uploader
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('No admin user found. Creating media assets without uploader...')
    }

    for (const asset of sampleMediaAssets) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingAsset = await (prisma as any).mediaAsset.findFirst({
        where: { filename: asset.filename }
      })

      if (existingAsset) {
        console.log(`Media asset already exists: ${asset.filename}`)
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaAsset = await (prisma as any).mediaAsset.create({
        data: {
          ...asset,
          uploadedBy: adminUser?.id,
        }
      })

      console.log(`Created media asset: ${mediaAsset.filename}`)
    }

    console.log('Sample media assets creation completed!')

    // Display usage statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalAssets = await (prisma as any).mediaAsset.count()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assetsByCategory = await (prisma as any).mediaAsset.groupBy({
      by: ['category'],
      _count: true,
    })

    console.log(`\nMedia Assets Summary:`)
    console.log(`Total assets: ${totalAssets}`)
    console.log(`By category:`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assetsByCategory.forEach(({ category, _count }: any) => {
      console.log(`  ${category || 'Uncategorized'}: ${_count}`)
    })

  } catch (error) {
    console.error('Error creating sample media assets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleMediaAssets()
