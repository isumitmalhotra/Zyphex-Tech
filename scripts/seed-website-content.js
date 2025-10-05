const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedWebsiteContent() {
  console.log('🌱 Starting website content seeding...')

  // 1. Create Content Types for website sections
  const contentTypes = await Promise.all([
    prisma.contentType.upsert({
      where: { name: 'hero' },
      update: {},
      create: {
        name: 'hero',
        label: 'Hero Section',
        description: 'Hero sections for landing pages',
        fields: JSON.stringify({
          title: { type: 'string', required: true },
          subtitle: { type: 'string', required: true },
          description: { type: 'text', required: true },
          ctaText: { type: 'string', required: true },
          ctaLink: { type: 'string', required: true },
          backgroundImage: { type: 'string', required: false },
          features: { type: 'array', required: false }
        }),
        isActive: true
      }
    }),
    
    prisma.contentType.upsert({
      where: { name: 'services' },
      update: {},
      create: {
        name: 'services',
        label: 'Services',
        description: 'Service offerings',
        fields: JSON.stringify({
          title: { type: 'string', required: true },
          description: { type: 'text', required: true },
          icon: { type: 'string', required: false },
          features: { type: 'array', required: false },
          price: { type: 'string', required: false },
          ctaText: { type: 'string', required: false },
          ctaLink: { type: 'string', required: false }
        }),
        isActive: true
      }
    }),

    prisma.contentType.upsert({
      where: { name: 'portfolio' },
      update: {},
      create: {
        name: 'portfolio',
        label: 'Portfolio Projects',
        description: 'Portfolio project showcases',
        fields: JSON.stringify({
          title: { type: 'string', required: true },
          description: { type: 'text', required: true },
          image: { type: 'string', required: false },
          technologies: { type: 'array', required: false },
          liveUrl: { type: 'string', required: false },
          githubUrl: { type: 'string', required: false },
          category: { type: 'string', required: true }
        }),
        isActive: true
      }
    }),

    prisma.contentType.upsert({
      where: { name: 'blog' },
      update: {},
      create: {
        name: 'blog',
        label: 'Blog Posts',
        description: 'Blog articles and posts',
        fields: JSON.stringify({
          title: { type: 'string', required: true },
          excerpt: { type: 'text', required: true },
          content: { type: 'rich-text', required: true },
          image: { type: 'string', required: false },
          readTime: { type: 'string', required: false },
          author: { type: 'string', required: true }
        }),
        isActive: true
      }
    }),

    prisma.contentType.upsert({
      where: { name: 'team' },
      update: {},
      create: {
        name: 'team',
        label: 'Team Members',
        description: 'Team member profiles',
        fields: JSON.stringify({
          name: { type: 'string', required: true },
          position: { type: 'string', required: true },
          bio: { type: 'text', required: true },
          image: { type: 'string', required: false },
          skills: { type: 'array', required: false },
          social: { type: 'object', required: false }
        }),
        isActive: true
      }
    }),

    prisma.contentType.upsert({
      where: { name: 'about' },
      update: {},
      create: {
        name: 'about',
        label: 'About Section',
        description: 'About company information',
        fields: JSON.stringify({
          title: { type: 'string', required: true },
          content: { type: 'rich-text', required: true },
          mission: { type: 'text', required: false },
          vision: { type: 'text', required: false },
          values: { type: 'array', required: false },
          stats: { type: 'array', required: false }
        }),
        isActive: true
      }
    }),

    prisma.contentType.upsert({
      where: { name: 'testimonials' },
      update: {},
      create: {
        name: 'testimonials',
        label: 'Testimonials',
        description: 'Client testimonials and reviews',
        fields: JSON.stringify({
          name: { type: 'string', required: true },
          role: { type: 'string', required: true },
          company: { type: 'string', required: false },
          content: { type: 'text', required: true },
          rating: { type: 'number', required: false },
          image: { type: 'string', required: false }
        }),
        isActive: true
      }
    })
  ])

  console.log('✅ Content types created')

  // 2. Create Hero Sections
  const heroContent = await prisma.dynamicContentSection.upsert({
    where: { sectionKey: 'home-hero' },
    update: {},
    create: {
      contentTypeId: contentTypes[0].id,
      sectionKey: 'home-hero',
      title: 'Welcome to Zyphex Tech',
      subtitle: 'Leading Remote IT Services Platform',
      description: 'Transforming businesses through innovative technology solutions',
      layoutSettings: JSON.stringify({
        backgroundColor: 'gradient',
        textAlign: 'center',
        padding: 'large',
        showAnimation: true
      }),
      contentData: JSON.stringify({
        title: 'Transform Your Business with Expert IT Solutions',
        subtitle: 'Leading Remote IT Services Platform',
        description: 'We provide comprehensive IT services to help your business grow, scale, and succeed in the digital age. From custom software development to cloud solutions and cybersecurity.',
        ctaText: 'Start Your Project',
        ctaLink: '/contact',
        features: [
          'Custom Software Development',
          'Cloud Infrastructure Setup',
          'DevOps & Automation',
          '24/7 Support & Monitoring'
        ]
      }),
      isActive: true,
      order: 1
    }
  })

  // 3. Create Services Content
  const servicesData = [
    {
      title: 'Custom Software Development',
      description: 'Build tailored software solutions that perfectly fit your business needs with modern technologies and best practices.',
      icon: 'Code',
      features: [
        'Full-stack web applications',
        'Mobile app development',
        'API development & integration',
        'Database design & optimization',
        'Legacy system modernization'
      ],
      price: 'Starting from $5,000',
      ctaText: 'Get Quote',
      ctaLink: '/contact'
    },
    {
      title: 'Cloud Infrastructure',
      description: 'Migrate to the cloud and scale your business with secure, reliable, and cost-effective cloud solutions.',
      icon: 'Cloud',
      features: [
        'AWS/Azure/GCP setup',
        'Cloud migration services',
        'Infrastructure as Code',
        'Auto-scaling configuration',
        'Disaster recovery planning'
      ],
      price: 'Starting from $2,000',
      ctaText: 'Learn More',
      ctaLink: '/services/cloud'
    },
    {
      title: 'DevOps & Automation',
      description: 'Streamline your development workflow with CI/CD pipelines, automated testing, and infrastructure automation.',
      icon: 'Settings',
      features: [
        'CI/CD pipeline setup',
        'Automated testing',
        'Container orchestration',
        'Monitoring & logging',
        'Security automation'
      ],
      price: 'Starting from $3,000',
      ctaText: 'Get Started',
      ctaLink: '/contact'
    },
    {
      title: 'Cybersecurity Solutions',
      description: 'Protect your business with comprehensive security audits, threat monitoring, and compliance solutions.',
      icon: 'Shield',
      features: [
        'Security audits & assessments',
        'Penetration testing',
        'Compliance consulting',
        'Security monitoring',
        'Incident response'
      ],
      price: 'Starting from $2,500',
      ctaText: 'Secure Now',
      ctaLink: '/contact'
    },
    {
      title: 'IT Consulting',
      description: 'Get expert advice on technology strategy, digital transformation, and IT infrastructure optimization.',
      icon: 'Users',
      features: [
        'Technology strategy planning',
        'Digital transformation',
        'IT infrastructure audit',
        'Process optimization',
        'Team training & mentoring'
      ],
      price: 'Starting from $150/hour',
      ctaText: 'Consult Now',
      ctaLink: '/contact'
    },
    {
      title: '24/7 Support & Maintenance',
      description: 'Keep your systems running smoothly with our round-the-clock support and proactive maintenance services.',
      icon: 'HeadphonesIcon',
      features: [
        '24/7 technical support',
        'Proactive monitoring',
        'Regular system updates',
        'Performance optimization',
        'Emergency response'
      ],
      price: 'Starting from $500/month',
      ctaText: 'Get Support',
      ctaLink: '/contact'
    }
  ]

  for (let i = 0; i < servicesData.length; i++) {
    await prisma.dynamicContentItem.upsert({
      where: { 
        contentTypeId_slug: {
          contentTypeId: contentTypes[1].id,
          slug: `service-${i + 1}`
        }
      },
      update: {},
      create: {
        contentTypeId: contentTypes[1].id,
        slug: `service-${i + 1}`,
        title: servicesData[i].title,
        data: JSON.stringify(servicesData[i]),
        status: 'PUBLISHED',
        featured: i < 3,
        order: i + 1,
        categories: JSON.stringify(['services']),
        tags: JSON.stringify(['technology', 'business', 'development']),
        author: 'Zyphex Tech Team',
        publishedAt: new Date()
      }
    })
  }

  // 4. Create Portfolio Projects
  const portfolioData = [
    {
      title: 'E-commerce Platform Modernization',
      description: 'Complete overhaul of legacy e-commerce system with modern React/Node.js stack, resulting in 40% faster load times and 25% increase in conversions.',
      image: '/images/portfolio/ecommerce.jpg',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
      liveUrl: 'https://example-store.com',
      githubUrl: 'https://github.com/zyphex/ecommerce-platform',
      category: 'web-development'
    },
    {
      title: 'Healthcare Management System',
      description: 'HIPAA-compliant healthcare management platform with patient portal, appointment scheduling, and telemedicine capabilities.',
      image: '/images/portfolio/healthcare.jpg',
      technologies: ['Next.js', 'Python', 'Django', 'PostgreSQL', 'Docker'],
      liveUrl: 'https://health-system.com',
      githubUrl: 'https://github.com/zyphex/health-management',
      category: 'enterprise'
    },
    {
      title: 'Real-time Analytics Dashboard',
      description: 'Advanced analytics dashboard with real-time data visualization, custom reporting, and predictive analytics for business intelligence.',
      image: '/images/portfolio/analytics.jpg',
      technologies: ['Vue.js', 'D3.js', 'Node.js', 'InfluxDB', 'Kubernetes'],
      liveUrl: 'https://analytics-demo.com',
      githubUrl: 'https://github.com/zyphex/analytics-dashboard',
      category: 'data-visualization'
    },
    {
      title: 'Mobile Banking Application',
      description: 'Secure mobile banking app with biometric authentication, real-time transactions, and comprehensive financial management tools.',
      image: '/images/portfolio/mobile-banking.jpg',
      technologies: ['React Native', 'Express.js', 'MongoDB', 'Stripe API', 'Firebase'],
      liveUrl: 'https://app.mobilebank.com',
      githubUrl: 'https://github.com/zyphex/mobile-banking',
      category: 'mobile-development'
    },
    {
      title: 'Cloud Infrastructure Automation',
      description: 'Infrastructure as Code solution for automated cloud provisioning, scaling, and management across multiple cloud providers.',
      image: '/images/portfolio/cloud-automation.jpg',
      technologies: ['Terraform', 'Ansible', 'Kubernetes', 'AWS', 'Azure'],
      liveUrl: 'https://cloud-demo.zyphex.com',
      githubUrl: 'https://github.com/zyphex/cloud-automation',
      category: 'devops'
    },
    {
      title: 'AI-Powered Chatbot Platform',
      description: 'Intelligent customer service chatbot with natural language processing, multi-language support, and integration capabilities.',
      image: '/images/portfolio/chatbot.jpg',
      technologies: ['Python', 'TensorFlow', 'Flask', 'Redis', 'Elasticsearch'],
      liveUrl: 'https://chatbot.example.com',
      githubUrl: 'https://github.com/zyphex/ai-chatbot',
      category: 'ai-ml'
    }
  ]

  for (let i = 0; i < portfolioData.length; i++) {
    await prisma.dynamicContentItem.upsert({
      where: { 
        contentTypeId_slug: {
          contentTypeId: contentTypes[2].id,
          slug: `portfolio-${i + 1}`
        }
      },
      update: {},
      create: {
        contentTypeId: contentTypes[2].id,
        slug: `portfolio-${i + 1}`,
        title: portfolioData[i].title,
        data: JSON.stringify(portfolioData[i]),
        status: 'PUBLISHED',
        featured: i < 3,
        order: i + 1,
        categories: JSON.stringify([portfolioData[i].category]),
        tags: JSON.stringify(portfolioData[i].technologies),
        author: 'Zyphex Tech Team',
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Stagger dates
      }
    })
  }

  // 5. Create Blog Posts
  const blogData = [
    {
      title: 'The Future of Remote Development Teams',
      excerpt: 'Exploring how remote development teams are reshaping the software industry and best practices for managing distributed teams.',
      content: `
        <h2>Introduction</h2>
        <p>The landscape of software development has fundamentally changed over the past few years. Remote development teams have evolved from a necessity during the pandemic to a preferred working model for many organizations.</p>
        
        <h2>Benefits of Remote Development</h2>
        <ul>
          <li>Access to global talent pool</li>
          <li>Reduced operational costs</li>
          <li>Improved work-life balance</li>
          <li>Increased productivity and focus</li>
        </ul>
        
        <h2>Best Practices</h2>
        <p>Successfully managing remote teams requires proper tools, communication strategies, and cultural alignment. Here are our top recommendations...</p>
      `,
      image: '/images/blog/remote-teams.jpg',
      readTime: '8 min read',
      author: 'Sarah Johnson'
    },
    {
      title: 'Cloud Migration Strategy: A Complete Guide',
      excerpt: 'Step-by-step guide to planning and executing a successful cloud migration for your business applications and infrastructure.',
      content: `
        <h2>Why Migrate to the Cloud?</h2>
        <p>Cloud migration offers numerous benefits including scalability, cost reduction, and improved disaster recovery capabilities.</p>
        
        <h2>Migration Strategies</h2>
        <ol>
          <li>Rehosting (Lift and Shift)</li>
          <li>Replatforming</li>
          <li>Refactoring</li>
          <li>Repurchasing</li>
          <li>Retiring</li>
          <li>Retaining</li>
        </ol>
        
        <h2>Planning Your Migration</h2>
        <p>Successful cloud migration requires careful planning, assessment of current infrastructure, and choosing the right cloud provider...</p>
      `,
      image: '/images/blog/cloud-migration.jpg',
      readTime: '12 min read',
      author: 'Michael Chen'
    },
    {
      title: 'Cybersecurity Best Practices for 2024',
      excerpt: 'Essential cybersecurity measures every business should implement to protect against evolving threats in the digital landscape.',
      content: `
        <h2>The Current Threat Landscape</h2>
        <p>Cyber threats continue to evolve, with ransomware, phishing, and social engineering attacks becoming more sophisticated.</p>
        
        <h2>Essential Security Measures</h2>
        <ul>
          <li>Multi-factor authentication</li>
          <li>Regular security audits</li>
          <li>Employee training programs</li>
          <li>Incident response planning</li>
        </ul>
        
        <h2>Implementation Strategy</h2>
        <p>Building a robust cybersecurity framework requires a comprehensive approach that addresses people, processes, and technology...</p>
      `,
      image: '/images/blog/cybersecurity.jpg',
      readTime: '10 min read',
      author: 'David Rodriguez'
    }
  ]

  for (let i = 0; i < blogData.length; i++) {
    await prisma.dynamicContentItem.upsert({
      where: { 
        contentTypeId_slug: {
          contentTypeId: contentTypes[3].id,
          slug: `blog-${i + 1}`
        }
      },
      update: {},
      create: {
        contentTypeId: contentTypes[3].id,
        slug: `blog-${i + 1}`,
        title: blogData[i].title,
        data: JSON.stringify(blogData[i]),
        status: 'PUBLISHED',
        featured: i < 2,
        order: i + 1,
        categories: JSON.stringify(['technology', 'business']),
        tags: JSON.stringify(['development', 'cloud', 'security']),
        author: blogData[i].author,
        publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000) // Weekly intervals
      }
    })
  }

  // 6. Create Team Members
  const teamData = [
    {
      name: 'Sumit Malhotra',
      position: 'Founder & CEO',
      bio: 'Experienced technology leader with over 10 years in software development and business strategy. Passionate about building innovative solutions that drive business growth.',
      image: '/images/team/sumit.jpg',
      skills: ['Leadership', 'Strategy', 'Full-Stack Development', 'Cloud Architecture'],
      social: {
        linkedin: 'https://linkedin.com/in/sumitmalhotra',
        twitter: 'https://twitter.com/sumitmalhotra',
        github: 'https://github.com/isumitmalhotra'
      }
    },
    {
      name: 'Sarah Johnson',
      position: 'CTO & Lead Developer',
      bio: 'Full-stack developer specializing in modern web technologies and cloud infrastructure. Expert in React, Node.js, and DevOps practices.',
      image: '/images/team/sarah.jpg',
      skills: ['React', 'Node.js', 'AWS', 'DevOps', 'Architecture'],
      social: {
        linkedin: 'https://linkedin.com/in/sarahjohnson',
        github: 'https://github.com/sarahjohnson'
      }
    },
    {
      name: 'Michael Chen',
      position: 'Senior Cloud Architect',
      bio: 'Cloud infrastructure specialist with expertise in AWS, Azure, and Google Cloud. Focuses on scalable, secure, and cost-effective cloud solutions.',
      image: '/images/team/michael.jpg',
      skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Security'],
      social: {
        linkedin: 'https://linkedin.com/in/michaelchen',
        github: 'https://github.com/michaelchen'
      }
    },
    {
      name: 'Emily Davis',
      position: 'UI/UX Designer',
      bio: 'Creative designer passionate about user experience and interface design. Specializes in creating intuitive and engaging digital experiences.',
      image: '/images/team/emily.jpg',
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'],
      social: {
        linkedin: 'https://linkedin.com/in/emilydavis',
        dribbble: 'https://dribbble.com/emilydavis'
      }
    }
  ]

  for (let i = 0; i < teamData.length; i++) {
    await prisma.dynamicContentItem.upsert({
      where: { 
        contentTypeId_slug: {
          contentTypeId: contentTypes[4].id,
          slug: `team-${i + 1}`
        }
      },
      update: {},
      create: {
        contentTypeId: contentTypes[4].id,
        slug: `team-${i + 1}`,
        title: teamData[i].name,
        data: JSON.stringify(teamData[i]),
        status: 'PUBLISHED',
        featured: i < 2,
        order: i + 1,
        categories: JSON.stringify(['team']),
        tags: JSON.stringify(['leadership', 'development', 'design']),
        author: 'Zyphex Tech',
        publishedAt: new Date()
      }
    })
  }

  // 7. Create About Section
  await prisma.dynamicContentSection.upsert({
    where: { sectionKey: 'about-company' },
    update: {},
    create: {
      contentTypeId: contentTypes[5].id,
      sectionKey: 'about-company',
      title: 'About Zyphex Tech',
      subtitle: 'Leading the Future of Technology',
      description: 'Our story, mission, and values',
      layoutSettings: JSON.stringify({
        layout: 'two-column',
        backgroundColor: 'white',
        textAlign: 'left'
      }),
      contentData: JSON.stringify({
        title: 'About Zyphex Tech',
        content: `
          <p>Founded in 2020, Zyphex Tech has rapidly become a trusted partner for businesses seeking innovative technology solutions. We specialize in custom software development, cloud infrastructure, and digital transformation services.</p>
          
          <p>Our team of experienced developers, architects, and consultants work remotely from around the globe, bringing diverse perspectives and expertise to every project. We believe in the power of technology to transform businesses and create meaningful impact.</p>
          
          <p>With a focus on quality, innovation, and customer success, we've helped over 100 companies across various industries achieve their technology goals and accelerate their digital transformation journey.</p>
        `,
        mission: 'To empower businesses through innovative technology solutions that drive growth, efficiency, and competitive advantage.',
        vision: 'To be the world\'s most trusted remote IT services partner, known for excellence, innovation, and customer success.',
        values: [
          {
            title: 'Excellence',
            description: 'We strive for the highest quality in everything we do'
          },
          {
            title: 'Innovation',
            description: 'We embrace new technologies and creative problem-solving'
          },
          {
            title: 'Integrity',
            description: 'We build trust through honest, transparent communication'
          },
          {
            title: 'Collaboration',
            description: 'We work as partners with our clients and team members'
          }
        ],
        stats: [
          { label: 'Projects Completed', value: '150+' },
          { label: 'Happy Clients', value: '100+' },
          { label: 'Team Members', value: '25+' },
          { label: 'Years of Experience', value: '50+' }
        ]
      }),
      isActive: true,
      order: 1
    }
  })

  // 7. Create Testimonials
  const testimonialsData = [
    {
      name: 'Sarah Johnson',
      role: 'CTO',
      company: 'TechStart Inc.',
      content: 'The team delivered an exceptional cloud migration solution that reduced our infrastructure costs by 40% while improving performance. Their expertise and professionalism are unmatched.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'CEO',
      company: 'DataFlow Solutions',
      content: 'Working with Zyphex Tech transformed our data analytics capabilities. The custom dashboard they built gives us insights we never had before, directly impacting our decision-making process.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Operations Director',
      company: 'RetailMax',
      content: 'Their mobile app development team created an amazing customer experience for our retail business. Sales through the app increased by 60% in the first quarter after launch.',
      rating: 5
    }
  ]

  for (const testimonialData of testimonialsData) {
    await prisma.dynamicContentItem.upsert({
      where: {
        contentTypeId_slug: {
          contentTypeId: contentTypes[6].id, // testimonials content type
          slug: `testimonial-${testimonialData.name.toLowerCase().replace(/\s+/g, '-')}`
        }
      },
      update: {},
      create: {
        contentTypeId: contentTypes[6].id,
        slug: `testimonial-${testimonialData.name.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${testimonialData.name} - ${testimonialData.company}`,
        data: JSON.stringify(testimonialData),
        status: 'published',
        featured: true,
        categories: JSON.stringify(['testimonials']),
        tags: JSON.stringify(['review', 'client', 'feedback']),
        order: testimonialsData.indexOf(testimonialData) + 1
      }
    })
  }

  console.log('✅ Website content seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`   - ${contentTypes.length} content types`)
  console.log(`   - ${servicesData.length} services`)
  console.log(`   - ${portfolioData.length} portfolio projects`)
  console.log(`   - ${blogData.length} blog posts`)
  console.log(`   - ${teamData.length} team members`)
  console.log(`   - ${testimonialsData.length} testimonials`)
  console.log(`   - 2 page sections (hero, about)`)
}

async function main() {
  try {
    await seedWebsiteContent()
  } catch (error) {
    console.error('❌ Error seeding website content:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Website content seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedWebsiteContent }