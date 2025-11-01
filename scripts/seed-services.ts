/**
 * Seed Services Data
 * Creates sample services in DynamicContentItem table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  console.log('🌱 Seeding Services...\n');

  try {
    // First, find or create "services" content type
    let contentType = await prisma.contentType.findUnique({
      where: { name: 'services' },
    });

    if (!contentType) {
      contentType = await prisma.contentType.create({
        data: {
          name: 'services',
          label: 'Services',
          description: 'Service offerings and solutions',
          icon: 'Briefcase',
          fields: JSON.stringify({
            description: { type: 'string', required: true },
            icon: { type: 'string', required: true },
            imageUrl: { type: 'string', required: false },
            features: { type: 'array', required: true },
            price: { type: 'string', required: false },
            ctaText: { type: 'string', required: false },
            ctaLink: { type: 'string', required: false },
          }),
          category: 'services',
          isActive: true,
          allowMultiple: true,
        },
      });
      console.log('✅ Created "services" content type\n');
    } else {
      console.log('✅ "services" content type already exists\n');
    }

    // Sample services data
    const services = [
      {
        title: 'Custom Software Development',
        slug: 'custom-software-development',
        data: {
          description: 'We build custom software solutions tailored to your business needs, from web applications to mobile apps and enterprise systems.',
          icon: 'Code',
          imageUrl: '/images/services/custom-software.jpg',
          features: [
            'Custom Web Applications',
            'Mobile App Development (iOS & Android)',
            'API Development & Integration',
            'Legacy System Modernization',
            'Microservices Architecture',
            'Cloud-Native Solutions',
          ],
          price: 'Starting at $5,000',
          ctaText: 'Get Started',
          ctaLink: '/contact',
        },
        featured: true,
        order: 1,
      },
      {
        title: 'Cloud Solutions & Migration',
        slug: 'cloud-solutions-migration',
        data: {
          description: 'Migrate your infrastructure to the cloud with our expert guidance. We specialize in AWS, Azure, and Google Cloud Platform.',
          icon: 'Cloud',
          imageUrl: '/images/services/cloud-solutions.jpg',
          features: [
            'Cloud Migration Strategy',
            'AWS/Azure/GCP Implementation',
            'Cloud Infrastructure Setup',
            'DevOps & CI/CD Pipelines',
            'Cost Optimization',
            '24/7 Monitoring & Support',
          ],
          price: 'Starting at $8,000',
          ctaText: 'Learn More',
          ctaLink: '/contact',
        },
        featured: true,
        order: 2,
      },
      {
        title: 'Cybersecurity Solutions',
        slug: 'cybersecurity-solutions',
        data: {
          description: 'Protect your business with comprehensive cybersecurity solutions including penetration testing, security audits, and compliance management.',
          icon: 'Shield',
          imageUrl: '/images/services/cybersecurity.jpg',
          features: [
            'Security Audits & Assessments',
            'Penetration Testing',
            'Vulnerability Management',
            'Compliance (GDPR, HIPAA, SOC 2)',
            'Security Training',
            'Incident Response',
          ],
          price: 'Starting at $3,000',
          ctaText: 'Secure Now',
          ctaLink: '/contact',
        },
        featured: true,
        order: 3,
      },
      {
        title: 'Data Analytics & BI',
        slug: 'data-analytics-bi',
        data: {
          description: 'Transform your data into actionable insights with our business intelligence and analytics solutions.',
          icon: 'BarChart',
          imageUrl: '/images/services/data-analytics.jpg',
          features: [
            'Data Warehouse Design',
            'ETL Pipeline Development',
            'Interactive Dashboards',
            'Predictive Analytics',
            'Machine Learning Models',
            'Real-time Reporting',
          ],
          price: 'Starting at $6,000',
          ctaText: 'Explore',
          ctaLink: '/contact',
        },
        featured: false,
        order: 4,
      },
      {
        title: 'Mobile App Development',
        slug: 'mobile-app-development',
        data: {
          description: 'Create stunning native and cross-platform mobile applications for iOS and Android with seamless user experiences.',
          icon: 'Smartphone',
          imageUrl: '/images/services/mobile-apps.jpg',
          features: [
            'iOS & Android Native Apps',
            'React Native Development',
            'Flutter Development',
            'App Store Optimization',
            'Push Notifications',
            'In-App Purchases',
          ],
          price: 'Starting at $10,000',
          ctaText: 'Build App',
          ctaLink: '/contact',
        },
        featured: false,
        order: 5,
      },
      {
        title: 'DevOps & Infrastructure',
        slug: 'devops-infrastructure',
        data: {
          description: 'Streamline your development workflow with automated CI/CD pipelines, container orchestration, and infrastructure as code.',
          icon: 'Server',
          imageUrl: '/images/services/devops.jpg',
          features: [
            'CI/CD Pipeline Setup',
            'Docker & Kubernetes',
            'Infrastructure as Code (Terraform)',
            'Automated Testing',
            'Monitoring & Alerting',
            'Performance Optimization',
          ],
          price: 'Starting at $4,500',
          ctaText: 'Optimize Now',
          ctaLink: '/contact',
        },
        featured: false,
        order: 6,
      },
    ];

    // Create services
    for (const service of services) {
      const existing = await prisma.dynamicContentItem.findFirst({
        where: {
          slug: service.slug,
          contentType: {
            name: 'services',
          },
        },
      });

      if (!existing) {
        await prisma.dynamicContentItem.create({
          data: {
            title: service.title,
            slug: service.slug,
            contentTypeId: contentType.id,
            data: JSON.stringify(service.data),
            status: 'PUBLISHED',
            featured: service.featured,
            order: service.order,
            categories: JSON.stringify(['Development', 'Technology']),
            tags: JSON.stringify(['software', 'development', 'consulting']),
          },
        });
        console.log(`✅ Created service: ${service.title}`);
      } else {
        console.log(`⏭️  Service already exists: ${service.title}`);
      }
    }

    console.log('\n✅ Services seeded successfully!');
    console.log('\nYou can now view services at:');
    console.log('  - Website: /services');
    console.log('  - API: /api/services');
    console.log('  - Admin: /admin/content/manage (filter by "services" content type)\n');

  } catch (error) {
    console.error('❌ Error seeding services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedServices()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
