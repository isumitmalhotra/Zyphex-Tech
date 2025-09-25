import { prisma } from '../lib/prisma'

// Type assertion for Prisma client with service model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaWithService = prisma as any

async function createSampleServices() {
  try {
    console.log('Creating sample services...')

    const services = [
      {
        title: "Custom Software Development",
        description: "Tailored software solutions built to meet your specific business needs and requirements. From web applications to enterprise systems, we deliver scalable and maintainable code.",
        icon: "Code",
        features: JSON.stringify([
          "Web Application Development",
          "Enterprise Software Solutions",
          "API Development & Integration",
          "Legacy System Modernization",
          "Progressive Web Apps (PWA)"
        ]),
        isActive: true,
        order: 1,
      },
      {
        title: "Cloud Solutions & Migration",
        description: "Seamless cloud migration and infrastructure management for optimal performance. We help you leverage the power of cloud computing to scale your business.",
        icon: "Cloud",
        features: JSON.stringify([
          "Cloud Strategy & Planning",
          "AWS/Azure/GCP Migration",
          "Cloud Architecture Design",
          "DevOps Implementation",
          "Container Orchestration"
        ]),
        isActive: true,
        order: 2,
      },
      {
        title: "Mobile App Development",
        description: "Cross-platform mobile applications that deliver exceptional user experiences. We build native and hybrid apps for iOS and Android platforms.",
        icon: "Smartphone",
        features: JSON.stringify([
          "iOS App Development",
          "Android App Development",
          "Cross-platform Solutions",
          "UI/UX Design",
          "App Store Optimization"
        ]),
        isActive: true,
        order: 3,
      },
      {
        title: "Data Analytics & BI",
        description: "Transform your data into actionable insights with our comprehensive analytics solutions. Make data-driven decisions to drive business growth.",
        icon: "BarChart3",
        features: JSON.stringify([
          "Business Intelligence Dashboards",
          "Data Visualization",
          "Predictive Analytics",
          "ETL Pipeline Development",
          "Real-time Analytics"
        ]),
        isActive: true,
        order: 4,
      },
      {
        title: "Cybersecurity Services",
        description: "Protect your digital assets with our comprehensive cybersecurity solutions. We implement robust security measures to safeguard your business.",
        icon: "Shield",
        features: JSON.stringify([
          "Security Audits & Assessments",
          "Penetration Testing",
          "Compliance Management",
          "Incident Response",
          "Security Training"
        ]),
        isActive: true,
        order: 5,
      },
      {
        title: "Digital Marketing Solutions",
        description: "Boost your online presence with our digital marketing expertise. We create comprehensive strategies to increase visibility and drive conversions.",
        icon: "TrendingUp",
        features: JSON.stringify([
          "SEO Optimization",
          "Content Marketing",
          "Social Media Management",
          "PPC Advertising",
          "Email Marketing Campaigns"
        ]),
        isActive: true,
        order: 6,
      },
    ]

    for (const serviceData of services) {
      // Check if service already exists
      const existingService = await prismaWithService.service.findFirst({
        where: { title: serviceData.title }
      })

      if (!existingService) {
        const service = await prismaWithService.service.create({
          data: serviceData
        })
        console.log(`Created service: ${service.title}`)
      } else {
        console.log(`Service already exists: ${serviceData.title}`)
      }
    }

    console.log('Sample services creation completed!')
  } catch (error) {
    console.error('Error creating sample services:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleServices()
