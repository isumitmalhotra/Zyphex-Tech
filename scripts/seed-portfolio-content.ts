import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPortfolioContent() {
  console.log('🎨 Seeding portfolio content...')

  try {
    // First, ensure we have a portfolio content type
    let portfolioContentType = await prisma.contentType.findFirst({
      where: { name: 'portfolio' }
    })

    if (!portfolioContentType) {
      portfolioContentType = await prisma.contentType.create({
        data: {
          name: 'portfolio',
          label: 'Portfolio Projects',
          description: 'Showcase of completed projects and case studies',
          icon: '🎨',
          category: 'showcase',
          fields: JSON.stringify([
            {
              name: 'description',
              type: 'textarea',
              label: 'Project Description',
              required: true
            },
            {
              name: 'image',
              type: 'image',
              label: 'Project Image',
              required: true
            },
            {
              name: 'category',
              type: 'select',
              label: 'Project Category',
              options: ['Web Development', 'Mobile Development', 'AI & Machine Learning', 'Enterprise Software', 'IoT Development', 'Blockchain'],
              required: true
            },
            {
              name: 'technologies',
              type: 'array',
              label: 'Technologies Used',
              required: true
            },
            {
              name: 'liveUrl',
              type: 'url',
              label: 'Live Demo URL',
              required: false
            },
            {
              name: 'githubUrl',
              type: 'url',
              label: 'GitHub Repository',
              required: false
            }
          ]),
          settings: JSON.stringify({
            enableComments: false,
            enableVersioning: true,
            maxInstances: 50
          }),
          template: 'portfolio',
          isSystem: false,
          isActive: true,
          allowMultiple: true,
          maxInstances: 50
        }
      })
      console.log('✅ Created portfolio content type')
    }

    // Sample portfolio projects
    const portfolioProjects = [
      {
        title: 'E-Commerce Platform Revolution',
        slug: 'ecommerce-platform-revolution',
        description: 'A cutting-edge e-commerce solution with advanced features including AI-powered recommendations, real-time inventory management, and seamless payment integration. Built with scalability and user experience as top priorities.',
        data: {
          description: 'A cutting-edge e-commerce solution with advanced features including AI-powered recommendations, real-time inventory management, and seamless payment integration. Built with scalability and user experience as top priorities.',
          image: '/images/portfolio/ecommerce-platform.jpg',
          category: 'Web Development',
          technologies: ['React', 'Next.js', 'Node.js', 'MongoDB', 'Stripe API', 'AWS', 'Redis'],
          liveUrl: 'https://demo-ecommerce.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/ecommerce-platform'
        },
        categories: ['Web Development', 'E-Commerce'],
        tags: ['React', 'Next.js', 'Node.js', 'MongoDB', 'Stripe', 'AWS'],
        featured: true,
        order: 1
      },
      {
        title: 'Secure Mobile Banking App',
        slug: 'secure-mobile-banking-app',
        description: 'Revolutionary mobile banking application with biometric authentication, real-time fraud detection, and comprehensive financial management tools. Trusted by over 100,000 users.',
        data: {
          description: 'Revolutionary mobile banking application with biometric authentication, real-time fraud detection, and comprehensive financial management tools. Trusted by over 100,000 users.',
          image: '/images/portfolio/banking-app.jpg',
          category: 'Mobile Development',
          technologies: ['React Native', 'Node.js', 'PostgreSQL', 'JWT', 'Biometric API', 'Docker'],
          liveUrl: 'https://demo-banking.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/mobile-banking'
        },
        categories: ['Mobile Development', 'FinTech'],
        tags: ['React Native', 'Node.js', 'PostgreSQL', 'Security', 'Biometrics'],
        featured: true,
        order: 2
      },
      {
        title: 'AI-Powered Healthcare System',
        slug: 'ai-powered-healthcare-system',
        description: 'Comprehensive healthcare management platform featuring AI diagnostics, patient records, appointment scheduling, and telemedicine capabilities. Revolutionizing patient care delivery.',
        data: {
          description: 'Comprehensive healthcare management platform featuring AI diagnostics, patient records, appointment scheduling, and telemedicine capabilities. Revolutionizing patient care delivery.',
          image: '/images/portfolio/healthcare-system.jpg',
          category: 'Enterprise Software',
          technologies: ['Vue.js', 'Laravel', 'MySQL', 'TensorFlow', 'Docker', 'HL7 FHIR'],
          liveUrl: 'https://demo-healthcare.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/healthcare-ai'
        },
        categories: ['Enterprise Software', 'Healthcare', 'AI'],
        tags: ['Vue.js', 'Laravel', 'MySQL', 'AI', 'Healthcare', 'TensorFlow'],
        featured: true,
        order: 3
      },
      {
        title: 'Smart Analytics Dashboard',
        slug: 'smart-analytics-dashboard',
        description: 'Advanced business intelligence dashboard with machine learning capabilities, predictive analytics, and real-time data visualization. Empowering data-driven decisions.',
        data: {
          description: 'Advanced business intelligence dashboard with machine learning capabilities, predictive analytics, and real-time data visualization. Empowering data-driven decisions.',
          image: '/images/portfolio/ai-dashboard.jpg',
          category: 'AI & Machine Learning',
          technologies: ['Python', 'TensorFlow', 'React', 'FastAPI', 'Redis', 'D3.js'],
          liveUrl: 'https://demo-analytics.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/smart-analytics'
        },
        categories: ['AI & Machine Learning', 'Data Analytics'],
        tags: ['Python', 'TensorFlow', 'React', 'Analytics', 'Machine Learning'],
        featured: true,
        order: 4
      },
      {
        title: 'IoT Smart Home Ecosystem',
        slug: 'iot-smart-home-ecosystem',
        description: 'Complete IoT solution for smart homes with device management, automation rules, energy monitoring, and voice control integration. Making homes truly intelligent.',
        data: {
          description: 'Complete IoT solution for smart homes with device management, automation rules, energy monitoring, and voice control integration. Making homes truly intelligent.',
          image: '/images/portfolio/iot-system.jpg',
          category: 'IoT Development',
          technologies: ['Arduino', 'Raspberry Pi', 'MQTT', 'Node.js', 'React', 'InfluxDB'],
          liveUrl: 'https://demo-smarthome.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/smart-home-iot'
        },
        categories: ['IoT Development', 'Smart Home'],
        tags: ['IoT', 'Arduino', 'Raspberry Pi', 'MQTT', 'Home Automation'],
        featured: false,
        order: 5
      },
      {
        title: 'Blockchain Voting Platform',
        slug: 'blockchain-voting-platform',
        description: 'Transparent and secure voting platform built on blockchain technology ensuring tamper-proof elections and real-time result verification.',
        data: {
          description: 'Transparent and secure voting platform built on blockchain technology ensuring tamper-proof elections and real-time result verification.',
          image: '/images/portfolio/blockchain-voting.jpg',
          category: 'Blockchain',
          technologies: ['Solidity', 'Ethereum', 'Web3.js', 'React', 'Node.js', 'IPFS'],
          liveUrl: 'https://demo-voting.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/blockchain-voting'
        },
        categories: ['Blockchain', 'Government', 'Security'],
        tags: ['Blockchain', 'Ethereum', 'Solidity', 'Web3', 'Voting'],
        featured: false,
        order: 6
      },
      {
        title: 'Real-Time Chat Application',
        slug: 'real-time-chat-application',
        description: 'Modern chat application with real-time messaging, file sharing, video calls, and end-to-end encryption. Connecting people worldwide securely.',
        data: {
          description: 'Modern chat application with real-time messaging, file sharing, video calls, and end-to-end encryption. Connecting people worldwide securely.',
          image: '/images/portfolio/chat-app.jpg',
          category: 'Web Development',
          technologies: ['Socket.io', 'React', 'Node.js', 'MongoDB', 'WebRTC', 'Redis'],
          liveUrl: 'https://demo-chat.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/realtime-chat'
        },
        categories: ['Web Development', 'Communication'],
        tags: ['Socket.io', 'Real-time', 'WebRTC', 'Chat', 'Encryption'],
        featured: false,
        order: 7
      },
      {
        title: 'Cloud Infrastructure Monitor',
        slug: 'cloud-infrastructure-monitor',
        description: 'Comprehensive cloud monitoring solution with automated scaling, performance analytics, and cost optimization. Keeping your infrastructure healthy and efficient.',
        data: {
          description: 'Comprehensive cloud monitoring solution with automated scaling, performance analytics, and cost optimization. Keeping your infrastructure healthy and efficient.',
          image: '/images/portfolio/cloud-monitor.jpg',
          category: 'DevOps',
          technologies: ['Kubernetes', 'Prometheus', 'Grafana', 'Docker', 'AWS', 'Terraform'],
          liveUrl: 'https://demo-monitor.zyphextech.com',
          githubUrl: 'https://github.com/zyphextech/cloud-monitor'
        },
        categories: ['DevOps', 'Cloud Computing'],
        tags: ['Kubernetes', 'Monitoring', 'AWS', 'DevOps', 'Infrastructure'],
        featured: false,
        order: 8
      }
    ]

    // Create portfolio items
    for (const project of portfolioProjects) {
      const existing = await prisma.dynamicContentItem.findFirst({
        where: {
          slug: project.slug,
          contentTypeId: portfolioContentType.id
        }
      })

      if (!existing) {
        await prisma.dynamicContentItem.create({
          data: {
            contentTypeId: portfolioContentType.id,
            slug: project.slug,
            title: project.title,
            data: JSON.stringify(project.data),
            status: 'PUBLISHED',
            featured: project.featured,
            publishedAt: new Date(),
            order: project.order,
            categories: JSON.stringify(project.categories),
            tags: JSON.stringify(project.tags),
            author: 'ZyphexTech Team',
            metadata: JSON.stringify({
              seo: {
                title: project.title,
                description: project.description,
                keywords: project.tags.join(', ')
              }
            })
          }
        })
        console.log(`✅ Created portfolio project: ${project.title}`)
      } else {
        console.log(`⚠️  Portfolio project already exists: ${project.title}`)
      }
    }

    console.log('🎉 Portfolio content seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding portfolio content:', error)
    throw error
  }
}

// Run the seeding function
seedPortfolioContent()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })