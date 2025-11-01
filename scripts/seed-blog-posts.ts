import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBlogPosts() {
  console.log('📝 Seeding blog posts...\n')

  try {
    // Find or create blog content type
    let blogType = await prisma.contentType.findFirst({
      where: { name: 'blog' }
    })

    if (!blogType) {
      blogType = await prisma.contentType.create({
        data: {
          name: 'blog',
          label: 'Blog Posts',
          description: 'Blog posts and articles',
          icon: 'FileText',
          fields: JSON.stringify([
            { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
            { name: 'content', label: 'Content', type: 'richtext', required: true },
            { name: 'imageUrl', label: 'Featured Image', type: 'image', required: true },
            { name: 'author', label: 'Author', type: 'text', required: true },
            { name: 'readTime', label: 'Read Time', type: 'text', required: false }
          ]),
          category: 'content',
          isSystem: false,
          isActive: true,
          allowMultiple: true
        }
      })
      console.log('✅ Created blog content type')
    }

    // Blog posts data
    const blogPosts = [
      {
        title: 'The Future of AI in Software Development',
        slug: 'future-of-ai-in-software-development',
        data: {
          excerpt: 'Explore how artificial intelligence is transforming the way we build software and what it means for developers.',
          content: '<p>Artificial intelligence is revolutionizing software development...</p>',
          imageUrl: '/images/blog/ai-development.jpg',
          author: 'Sarah Johnson',
          readTime: '5 min read'
        },
        categories: ['Technology', 'AI'],
        tags: ['AI', 'Machine Learning', 'Development'],
        featured: true,
        order: 1
      },
      {
        title: 'Building Scalable Microservices Architecture',
        slug: 'building-scalable-microservices',
        data: {
          excerpt: 'Learn best practices for designing and implementing microservices that can scale with your business.',
          content: '<p>Microservices architecture has become the standard...</p>',
          imageUrl: '/images/blog/microservices.jpg',
          author: 'Michael Chen',
          readTime: '8 min read'
        },
        categories: ['Architecture', 'Backend'],
        tags: ['Microservices', 'Scalability', 'Cloud'],
        featured: true,
        order: 2
      },
      {
        title: 'Cybersecurity Best Practices for Modern Applications',
        slug: 'cybersecurity-best-practices',
        data: {
          excerpt: 'Essential security measures every development team should implement to protect their applications.',
          content: '<p>In today\'s digital landscape, security is paramount...</p>',
          imageUrl: '/images/blog/cybersecurity.jpg',
          author: 'David Martinez',
          readTime: '6 min read'
        },
        categories: ['Security', 'Best Practices'],
        tags: ['Security', 'Cybersecurity', 'DevSecOps'],
        featured: true,
        order: 3
      },
      {
        title: 'Cloud Migration Strategies for Enterprise',
        slug: 'cloud-migration-strategies',
        data: {
          excerpt: 'A comprehensive guide to planning and executing successful cloud migration for large organizations.',
          content: '<p>Moving to the cloud requires careful planning...</p>',
          imageUrl: '/images/blog/cloud-migration.jpg',
          author: 'Emily Rodriguez',
          readTime: '10 min read'
        },
        categories: ['Cloud', 'Enterprise'],
        tags: ['Cloud', 'Migration', 'AWS', 'Azure'],
        featured: false,
        order: 4
      },
      {
        title: 'DevOps Culture: Beyond the Tools',
        slug: 'devops-culture-beyond-tools',
        data: {
          excerpt: 'Understanding how DevOps is more about culture and collaboration than just automation tools.',
          content: '<p>DevOps transformation starts with people...</p>',
          imageUrl: '/images/blog/devops-culture.jpg',
          author: 'Alex Thompson',
          readTime: '7 min read'
        },
        categories: ['DevOps', 'Culture'],
        tags: ['DevOps', 'Culture', 'Collaboration'],
        featured: false,
        order: 5
      },
      {
        title: 'Mobile-First Design Principles',
        slug: 'mobile-first-design-principles',
        data: {
          excerpt: 'Key principles for designing applications that work beautifully on mobile devices first.',
          content: '<p>Mobile-first design is no longer optional...</p>',
          imageUrl: '/images/blog/mobile-first.jpg',
          author: 'Jessica Kim',
          readTime: '5 min read'
        },
        categories: ['Design', 'Mobile'],
        tags: ['Mobile', 'Design', 'UX'],
        featured: false,
        order: 6
      }
    ]

    // Create blog posts
    for (const post of blogPosts) {
      const existingPost = await prisma.dynamicContentItem.findFirst({
        where: {
          contentTypeId: blogType.id,
          slug: post.slug
        }
      })

      if (!existingPost) {
        await prisma.dynamicContentItem.create({
          data: {
            contentTypeId: blogType.id,
            title: post.title,
            slug: post.slug,
            data: JSON.stringify(post.data),
            status: 'PUBLISHED',
            featured: post.featured,
            publishedAt: new Date(),
            order: post.order,
            categories: JSON.stringify(post.categories),
            tags: JSON.stringify(post.tags),
            author: post.data.author
          }
        })
        console.log(`✅ Created blog post: ${post.title}`)
      } else {
        console.log(`⏭️  Skipped existing blog post: ${post.title}`)
      }
    }

    console.log('\n🎉 Blog posts seeding completed successfully!')

    // Display summary
    const totalPosts = await prisma.dynamicContentItem.count({
      where: { contentTypeId: blogType.id }
    })
    const featuredPosts = await prisma.dynamicContentItem.count({
      where: { 
        contentTypeId: blogType.id,
        featured: true 
      }
    })
    
    console.log(`\n📊 Total blog posts: ${totalPosts} (${featuredPosts} featured)`)

  } catch (error) {
    console.error('❌ Error seeding blog posts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedBlogPosts()
