import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateImagesToReal() {
  console.log('🖼️  Updating placeholder images with real image URLs...\n')

  try {
    // Update Team Member Images
    console.log('👥 Updating team member images...')
    
    const teamMembers = [
      {
        slug: 'sumit-malhotra',
        imageUrl: 'https://ui-avatars.com/api/?name=Sumit+Malhotra&size=400&background=0D8ABC&color=fff&bold=true'
      },
      {
        slug: 'priya-sharma',
        imageUrl: 'https://ui-avatars.com/api/?name=Priya+Sharma&size=400&background=6366f1&color=fff&bold=true'
      },
      {
        slug: 'rahul-verma',
        imageUrl: 'https://ui-avatars.com/api/?name=Rahul+Verma&size=400&background=8b5cf6&color=fff&bold=true'
      },
      {
        slug: 'ananya-patel',
        imageUrl: 'https://ui-avatars.com/api/?name=Ananya+Patel&size=400&background=ec4899&color=fff&bold=true'
      },
      {
        slug: 'vikram-singh',
        imageUrl: 'https://ui-avatars.com/api/?name=Vikram+Singh&size=400&background=10b981&color=fff&bold=true'
      },
      {
        slug: 'neha-kapoor',
        imageUrl: 'https://ui-avatars.com/api/?name=Neha+Kapoor&size=400&background=f59e0b&color=fff&bold=true'
      }
    ]

    for (const member of teamMembers) {
      const teamMember = await prisma.dynamicContentItem.findFirst({
        where: {
          slug: member.slug,
          contentType: { name: 'team_member' }
        },
        include: { contentType: true }
      })

      if (teamMember) {
        const data = JSON.parse(teamMember.data)
        data.imageUrl = member.imageUrl
        
        await prisma.dynamicContentItem.update({
          where: { id: teamMember.id },
          data: { data: JSON.stringify(data) }
        })
        console.log(`✅ Updated ${member.slug}`)
      }
    }

    // Update Blog Post Images
    console.log('\n📝 Updating blog post images...')
    
    const blogPosts = await prisma.dynamicContentItem.findMany({
      where: { contentType: { name: 'blog' } },
      include: { contentType: true }
    })

    const blogImages = [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop', // AI
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=500&fit=crop', // Microservices
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=500&fit=crop', // Cybersecurity
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop', // Cloud
      'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=500&fit=crop', // DevOps
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop', // Mobile
    ]

    for (let i = 0; i < blogPosts.length; i++) {
      const post = blogPosts[i]
      const data = JSON.parse(post.data)
      data.imageUrl = blogImages[i] || blogImages[0]
      
      await prisma.dynamicContentItem.update({
        where: { id: post.id },
        data: { data: JSON.stringify(data) }
      })
      console.log(`✅ Updated blog post: ${post.title}`)
    }

    // Update Portfolio Project Images
    console.log('\n💼 Updating portfolio project images...')
    
    const portfolioProjects = await prisma.dynamicContentItem.findMany({
      where: { contentType: { name: 'portfolio' } },
      include: { contentType: true }
    })

    const portfolioImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', // E-commerce
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop', // Banking
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop', // Healthcare
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Analytics
      'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&h=600&fit=crop', // IoT
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop', // Blockchain
      'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=800&h=600&fit=crop', // Chat
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop', // Cloud Infrastructure
    ]

    for (let i = 0; i < portfolioProjects.length; i++) {
      const project = portfolioProjects[i]
      const data = JSON.parse(project.data)
      data.image = portfolioImages[i] || portfolioImages[0]
      data.imageUrl = portfolioImages[i] || portfolioImages[0]
      data.featuredImage = portfolioImages[i] || portfolioImages[0]
      
      await prisma.dynamicContentItem.update({
        where: { id: project.id },
        data: { data: JSON.stringify(data) }
      })
      console.log(`✅ Updated project: ${project.title}`)
    }

    // Update Service Images
    console.log('\n🛠️  Updating service images...')
    
    const services = await prisma.dynamicContentItem.findMany({
      where: { contentType: { name: 'services' } },
      include: { contentType: true }
    })

    const serviceImages = [
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop', // Software Dev
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop', // Cloud
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop', // Cybersecurity
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=600&fit=crop', // DevOps
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop', // Mobile
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Analytics
    ]

    for (let i = 0; i < services.length; i++) {
      const service = services[i]
      const data = JSON.parse(service.data)
      data.imageUrl = serviceImages[i] || serviceImages[0]
      
      await prisma.dynamicContentItem.update({
        where: { id: service.id },
        data: { data: JSON.stringify(data) }
      })
      console.log(`✅ Updated service: ${service.title}`)
    }

    console.log('\n✅ All images updated successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Team members: ${teamMembers.length} updated`)
    console.log(`   - Blog posts: ${blogPosts.length} updated`)
    console.log(`   - Portfolio projects: ${portfolioProjects.length} updated`)
    console.log(`   - Services: ${services.length} updated`)
    console.log(`   - Total: ${teamMembers.length + blogPosts.length + portfolioProjects.length + services.length} images updated`)
    
    console.log('\n🎉 Image update complete!')
    console.log('\nNext steps:')
    console.log('1. Visit http://localhost:3000 to see the updated images')
    console.log('2. Visit http://localhost:3000/about to see team member photos')
    console.log('3. Visit http://localhost:3000/services to see service images')
    console.log('4. Visit http://localhost:3000/portfolio to see project images')
    console.log('5. Visit http://localhost:3000/updates to see blog images')

  } catch (error) {
    console.error('❌ Error updating images:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateImagesToReal()
