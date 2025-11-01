import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTestimonials() {
  console.log('💬 Seeding testimonials...\n')

  try {
    // Find or create testimonial content type
    let testimonialType = await prisma.contentType.findFirst({
      where: { name: 'testimonial' }
    })

    if (!testimonialType) {
      testimonialType = await prisma.contentType.create({
        data: {
          name: 'testimonial',
          label: 'Testimonials',
          description: 'Client testimonials and reviews',
          icon: 'MessageSquare',
          fields: JSON.stringify([
            { name: 'content', label: 'Testimonial Content', type: 'textarea', required: true },
            { name: 'name', label: 'Client Name', type: 'text', required: true },
            { name: 'role', label: 'Role/Position', type: 'text', required: true },
            { name: 'company', label: 'Company', type: 'text', required: true },
            { name: 'rating', label: 'Rating', type: 'number', required: true },
            { name: 'imageUrl', label: 'Client Photo', type: 'image', required: false }
          ]),
          category: 'content',
          isSystem: false,
          isActive: true,
          allowMultiple: true
        }
      })
      console.log('✅ Created testimonial content type')
    }

    // Testimonials data
    const testimonials = [
      {
        title: 'Outstanding Software Development',
        slug: 'testimonial-john-smith',
        data: {
          content: 'Zyphex Tech transformed our business with their custom software solution. The team was professional, responsive, and delivered beyond our expectations. Our operational efficiency has increased by 40% since implementation.',
          name: 'John Smith',
          role: 'CTO',
          company: 'TechCorp Solutions',
          rating: 5,
          imageUrl: '/images/testimonials/john-smith.jpg'
        },
        categories: ['Software Development'],
        tags: ['Custom Software', 'Enterprise'],
        featured: true,
        order: 1
      },
      {
        title: 'Exceptional Cloud Migration',
        slug: 'testimonial-sarah-johnson',
        data: {
          content: 'The cloud migration project was seamless and well-executed. Zyphex Tech\'s expertise in AWS and their structured approach ensured zero downtime during the transition. Highly recommended for enterprise-level cloud solutions.',
          name: 'Sarah Johnson',
          role: 'Head of Infrastructure',
          company: 'Global Finance Corp',
          rating: 5,
          imageUrl: '/images/testimonials/sarah-johnson.jpg'
        },
        categories: ['Cloud Solutions'],
        tags: ['Cloud', 'AWS', 'Migration'],
        featured: true,
        order: 2
      },
      {
        title: 'Best-in-Class Mobile App',
        slug: 'testimonial-michael-chen',
        data: {
          content: 'Our mobile banking app built by Zyphex Tech has received outstanding user reviews. The attention to security, performance, and user experience was impressive. They truly understand modern mobile development.',
          name: 'Michael Chen',
          role: 'Product Director',
          company: 'NeoBank',
          rating: 5,
          imageUrl: '/images/testimonials/michael-chen.jpg'
        },
        categories: ['Mobile Development'],
        tags: ['Mobile', 'Banking', 'Security'],
        featured: true,
        order: 3
      },
      {
        title: 'Robust DevOps Implementation',
        slug: 'testimonial-emily-rodriguez',
        data: {
          content: 'Zyphex Tech completely revamped our deployment pipeline. We went from monthly releases to daily deployments with confidence. Their DevOps expertise is world-class.',
          name: 'Emily Rodriguez',
          role: 'VP of Engineering',
          company: 'DataStream Inc',
          rating: 5,
          imageUrl: '/images/testimonials/emily-rodriguez.jpg'
        },
        categories: ['DevOps'],
        tags: ['DevOps', 'CI/CD', 'Automation'],
        featured: false,
        order: 4
      },
      {
        title: 'Comprehensive Security Audit',
        slug: 'testimonial-david-martinez',
        data: {
          content: 'The cybersecurity assessment and subsequent implementation of security measures has given us peace of mind. Zyphex Tech identified vulnerabilities we didn\'t know existed and fixed them professionally.',
          name: 'David Martinez',
          role: 'CISO',
          company: 'SecureHealth Systems',
          rating: 5,
          imageUrl: '/images/testimonials/david-martinez.jpg'
        },
        categories: ['Cybersecurity'],
        tags: ['Security', 'Audit', 'Healthcare'],
        featured: false,
        order: 5
      },
      {
        title: 'Data Analytics Excellence',
        slug: 'testimonial-lisa-wong',
        data: {
          content: 'The analytics dashboard they built has transformed how we make business decisions. Real-time insights, beautiful visualizations, and powerful reporting capabilities. Exceptional work!',
          name: 'Lisa Wong',
          role: 'Chief Data Officer',
          company: 'RetailMax',
          rating: 5,
          imageUrl: '/images/testimonials/lisa-wong.jpg'
        },
        categories: ['Data Analytics'],
        tags: ['Analytics', 'BI', 'Dashboards'],
        featured: false,
        order: 6
      }
    ]

    // Create testimonials
    for (const testimonial of testimonials) {
      const existingTestimonial = await prisma.dynamicContentItem.findFirst({
        where: {
          contentTypeId: testimonialType.id,
          slug: testimonial.slug
        }
      })

      if (!existingTestimonial) {
        await prisma.dynamicContentItem.create({
          data: {
            contentTypeId: testimonialType.id,
            title: testimonial.title,
            slug: testimonial.slug,
            data: JSON.stringify(testimonial.data),
            status: 'PUBLISHED',
            featured: testimonial.featured,
            publishedAt: new Date(),
            order: testimonial.order,
            categories: JSON.stringify(testimonial.categories),
            tags: JSON.stringify(testimonial.tags)
          }
        })
        console.log(`✅ Created testimonial: ${testimonial.data.name} - ${testimonial.data.company}`)
      } else {
        console.log(`⏭️  Skipped existing testimonial: ${testimonial.data.name}`)
      }
    }

    console.log('\n🎉 Testimonials seeding completed successfully!')

    // Display summary
    const totalTestimonials = await prisma.dynamicContentItem.count({
      where: { contentTypeId: testimonialType.id }
    })
    const featuredTestimonials = await prisma.dynamicContentItem.count({
      where: { 
        contentTypeId: testimonialType.id,
        featured: true 
      }
    })
    
    console.log(`\n📊 Total testimonials: ${totalTestimonials} (${featuredTestimonials} featured)`)

  } catch (error) {
    console.error('❌ Error seeding testimonials:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTestimonials()
