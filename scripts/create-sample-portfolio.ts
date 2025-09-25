import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSamplePortfolioItems() {
  console.log('Creating sample portfolio items...')

  const samplePortfolioItems = [
    {
      title: 'E-Commerce Platform',
      description: 'A modern e-commerce solution with advanced features including payment integration, inventory management, and real-time analytics. Built with scalability and user experience in mind.',
      imageUrl: '/images/portfolio/ecommerce-platform.jpg',
      projectUrl: 'https://demo-ecommerce.zyphextech.com',
      category: 'Web Development',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API', 'AWS'],
      featured: true,
    },
    {
      title: 'Mobile Banking App',
      description: 'Secure and intuitive mobile banking application with biometric authentication, real-time transactions, and comprehensive financial management tools.',
      imageUrl: '/images/portfolio/banking-app.jpg',
      projectUrl: 'https://demo-banking.zyphextech.com',
      category: 'Mobile Development',
      technologies: ['React Native', 'Node.js', 'PostgreSQL', 'JWT', 'Biometric API'],
      featured: true,
    },
    {
      title: 'Healthcare Management System',
      description: 'Comprehensive healthcare management platform for clinics and hospitals featuring patient records, appointment scheduling, and billing integration.',
      imageUrl: '/images/portfolio/healthcare-system.jpg',
      projectUrl: 'https://demo-healthcare.zyphextech.com',
      category: 'Enterprise Software',
      technologies: ['Vue.js', 'Laravel', 'MySQL', 'Docker', 'HL7 FHIR'],
      featured: false,
    },
    {
      title: 'AI-Powered Analytics Dashboard',
      description: 'Advanced analytics dashboard with machine learning capabilities for business intelligence and predictive analytics.',
      imageUrl: '/images/portfolio/ai-dashboard.jpg',
      projectUrl: 'https://demo-analytics.zyphextech.com',
      category: 'AI & Machine Learning',
      technologies: ['Python', 'TensorFlow', 'React', 'FastAPI', 'Redis'],
      featured: true,
    },
    {
      title: 'IoT Smart Home System',
      description: 'Complete IoT solution for smart homes with device management, automation rules, and real-time monitoring capabilities.',
      imageUrl: '/images/portfolio/iot-system.jpg',
      projectUrl: 'https://demo-smarthome.zyphextech.com',
      category: 'IoT Development',
      technologies: ['Raspberry Pi', 'MQTT', 'Node.js', 'InfluxDB', 'Grafana'],
      featured: false,
    },
    {
      title: 'Blockchain Voting Platform',
      description: 'Secure and transparent voting platform built on blockchain technology ensuring vote integrity and transparency.',
      imageUrl: '/images/portfolio/blockchain-voting.jpg',
      category: 'Blockchain',
      technologies: ['Solidity', 'Ethereum', 'Web3.js', 'IPFS', 'MetaMask'],
      featured: false,
    }
  ]

  try {
    for (const item of samplePortfolioItems) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingItem = await (prisma as any).portfolioItem.findFirst({
        where: { title: item.title }
      })

      if (existingItem) {
        console.log(`Portfolio item already exists: ${item.title}`)
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const portfolioItem = await (prisma as any).portfolioItem.create({
        data: {
          ...item,
          technologies: JSON.stringify(item.technologies),
        }
      })

      console.log(`Created portfolio item: ${portfolioItem.title}`)
    }

    console.log('Sample portfolio items creation completed!')

  } catch (error) {
    console.error('Error creating sample portfolio items:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSamplePortfolioItems()
