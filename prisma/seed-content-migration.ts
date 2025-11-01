/**
 * Content Migration Seed Script
 * 
 * Purpose: Migrate static content from React components into PageContent database tables
 * This populates the PageContent and PageContentSection tables with all website content
 * 
 * Models: PageContent, PageContentSection (NOT CmsPage - these are separate!)
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🚀 Starting content migration seed...\n')

  // Clear existing content (optional - comment out if you want to keep existing data)
  console.log('🗑️  Cleaning existing page content...')
  await prisma.pageContentSection.deleteMany({})
  await prisma.pageContent.deleteMany({})
  console.log('✅ Cleaned existing data\n')

  // ============================================
  // HOME PAGE
  // ============================================
  console.log('📄 Creating Home Page...')
  const homePage = await prisma.pageContent.create({
    data: {
      pageKey: 'home',
      name: 'Home Page',
      slug: '/',
      title: 'Transform Your Business with Remote Excellence | Zyphex Tech',
      description: 'Leading remote IT solutions provider delivering innovative technology solutions through expert remote teams. Custom software, cloud migration, and comprehensive IT services.',
      status: 'published',
      sections: {
        create: [
          // Hero Section
          {
            sectionKey: 'hero',
            sectionType: 'hero',
            title: 'Transform Your Business with Remote Excellence',
            order: 1,
            isVisible: true,
            contentData: {
              badge: '🚀 Leading Remote IT Solutions Provider',
              title: 'Transform Your Business with',
              titleHighlight: 'Remote Excellence',
              description: 'Zyphex Tech delivers innovative technology solutions through expert remote teams. From custom software to cloud migration, we drive growth and efficiency from anywhere in the world.',
              ctaPrimary: {
                text: 'Get Free Consultation',
                link: '/contact'
              },
              ctaSecondary: {
                text: 'View Our Services',
                link: '/services'
              },
              stats: [
                { value: '50+', label: 'Projects Completed' },
                { value: '98%', label: 'Client Satisfaction' },
                { value: '24/7', label: 'Remote Support' }
              ]
            }
          },
          // About Intro Section
          {
            sectionKey: 'about-intro',
            sectionType: 'text',
            title: 'Empowering Businesses Through Technology',
            order: 2,
            isVisible: true,
            contentData: {
              description: "Founded with a vision to bridge the gap between complex technology and business success, our agency combines deep technical expertise with strategic thinking. We don't just build solutions; we craft digital experiences that transform how businesses operate and grow.",
              cta: {
                text: 'Learn More About Us',
                link: '/about'
              }
            }
          },
          // Services Overview Section
          {
            sectionKey: 'services-overview',
            sectionType: 'cards',
            title: 'Our Core Services',
            order: 3,
            isVisible: true,
            contentData: {
              subtitle: 'Comprehensive remote IT solutions tailored to meet your unique business needs',
              services: [
                {
                  icon: 'Code',
                  title: 'Custom Software Development',
                  description: 'Tailored applications built with cutting-edge technologies to solve your specific business challenges.',
                  features: ['Web Applications', 'Mobile Apps', 'API Development']
                },
                {
                  icon: 'Globe',
                  title: 'Cloud Solutions & Migration',
                  description: 'Seamless cloud adoption strategies that enhance scalability, security, and cost-effectiveness.',
                  features: ['AWS/Azure Migration', 'Cloud Architecture', 'DevOps Implementation']
                },
                {
                  icon: 'Database',
                  title: 'Data Analytics & BI',
                  description: 'Transform raw data into actionable insights with advanced analytics and business intelligence solutions.',
                  features: ['Data Warehousing', 'Real-time Analytics', 'Custom Dashboards']
                },
                {
                  icon: 'Smartphone',
                  title: 'Mobile App Development',
                  description: 'Native and cross-platform mobile applications that deliver exceptional user experiences.',
                  features: ['iOS Development', 'Android Development', 'React Native']
                },
                {
                  icon: 'Zap',
                  title: 'IT Consulting & Strategy',
                  description: 'Strategic technology guidance to align your IT infrastructure with business objectives.',
                  features: ['Technology Roadmap', 'Digital Transformation', 'IT Audit']
                },
                {
                  icon: 'Users',
                  title: 'Dedicated Development Teams',
                  description: 'Skilled remote teams that integrate seamlessly with your existing workflows and processes.',
                  features: ['Remote Teams', 'Staff Augmentation', 'Project Management']
                }
              ],
              cta: {
                text: 'Explore All Services',
                link: '/services'
              }
            }
          },
          // Interactive Showcase Section
          {
            sectionKey: 'demos',
            sectionType: 'interactive',
            title: 'Experience Our Solutions Live',
            order: 4,
            isVisible: true,
            contentData: {
              subtitle: 'Interact with real examples of our work and see how our solutions can transform your business',
              note: 'This section uses the InteractiveShowcase component'
            }
          },
          // Why Choose Us Section
          {
            sectionKey: 'why-choose-us',
            sectionType: 'features',
            title: 'Why Leading Companies Choose Us',
            order: 5,
            isVisible: true,
            contentData: {
              description: 'We combine technical excellence with business acumen to deliver solutions that not only work but drive real results.',
              image: '/images/why-choose-us.jpg',
              imageAlt: 'Why Choose Zyphex Tech - Expert Remote IT Team Collaboration',
              features: [
                {
                  title: 'Expert Team',
                  description: 'Our developers and consultants stay ahead of technology trends, ensuring you get cutting-edge solutions.'
                },
                {
                  title: 'Proven Track Record',
                  description: '50+ successful projects across various industries with 98% client satisfaction rate.'
                },
                {
                  title: 'Agile Methodology',
                  description: 'Fast, iterative development process that adapts to your changing needs and delivers value quickly.'
                },
                {
                  title: '24/7 Support',
                  description: 'Round-the-clock technical support to ensure your systems run smoothly without interruption.'
                }
              ]
            }
          },
          // Latest Updates Section
          {
            sectionKey: 'updates',
            sectionType: 'blog-preview',
            title: 'Latest Insights & Updates',
            order: 6,
            isVisible: true,
            contentData: {
              subtitle: 'Stay informed with our latest thoughts on technology trends, best practices, and industry insights',
              fallbackPosts: [
                {
                  id: '1',
                  title: 'The Future of Cloud Computing in 2024',
                  excerpt: 'Exploring emerging trends in cloud technology and how businesses can leverage them for competitive advantage.',
                  imageUrl: '/images/blog/cloud-computing.jpg',
                  publishedAt: '2024-12-15',
                  category: 'Cloud Technology',
                  slug: 'future-cloud-computing-2024'
                },
                {
                  id: '2',
                  title: 'AI Integration in Business Applications',
                  excerpt: 'How artificial intelligence is transforming business processes and creating new opportunities for growth.',
                  imageUrl: '/images/blog/ai-integration.jpg',
                  publishedAt: '2024-12-10',
                  category: 'Artificial Intelligence',
                  slug: 'ai-integration-business'
                },
                {
                  id: '3',
                  title: 'Cybersecurity Best Practices for SMBs',
                  excerpt: 'Essential security measures every small and medium business should implement to protect their digital assets.',
                  imageUrl: '/images/blog/cybersecurity.jpg',
                  publishedAt: '2024-12-05',
                  category: 'Security',
                  slug: 'cybersecurity-smb-practices'
                }
              ],
              cta: {
                text: 'View All Updates',
                link: '/updates'
              },
              note: 'Actual blog posts should come from DynamicContentItem table'
            }
          },
          // Testimonials Section
          {
            sectionKey: 'testimonials',
            sectionType: 'testimonials',
            title: 'What Our Clients Say',
            order: 7,
            isVisible: true,
            contentData: {
              subtitle: "Don't just take our word for it - hear from the businesses we've helped transform",
              testimonials: [
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
                  content: "Working with Zyphex Tech transformed our data analytics capabilities. The custom dashboard they built gives us insights we never had before, directly impacting our decision-making process.",
                  rating: 5
                },
                {
                  name: 'Emily Rodriguez',
                  role: 'Operations Director',
                  company: 'RetailMax',
                  content: 'Their mobile app development team created an amazing customer experience for our retail business. Sales through the app increased by 60% in the first quarter after launch.',
                  rating: 5
                }
              ],
              note: 'Should also fetch from testimonials content type if available'
            }
          },
          // CTA Section
          {
            sectionKey: 'cta',
            sectionType: 'cta',
            title: 'Ready to Transform Your Business?',
            order: 8,
            isVisible: true,
            contentData: {
              description: "Let's discuss how our IT solutions can drive your business forward. Get a free consultation and discover the possibilities.",
              ctaPrimary: {
                text: 'Start Your Project',
                link: '/contact'
              },
              ctaSecondary: {
                text: 'View Services',
                link: '/services'
              }
            }
          }
        ]
      }
    },
    include: {
      sections: true
    }
  })
  console.log(`✅ Created Home Page with ${homePage.sections.length} sections\n`)

  // ============================================
  // ABOUT PAGE
  // ============================================
  console.log('📄 Creating About Page...')
  const aboutPage = await prisma.pageContent.create({
    data: {
      pageKey: 'about',
      name: 'About Us',
      slug: '/about',
      title: 'About Zyphex Tech - Remote IT Solutions Team | Our Story',
      description: 'Learn about Zyphex Tech, our mission to transform businesses through innovative technology, and meet the expert team behind our remote IT solutions.',
      status: 'published',
      sections: {
        create: [
          // Hero Section
          {
            sectionKey: 'hero',
            sectionType: 'hero',
            title: "Building Tomorrow's Technology Solutions Today",
            order: 1,
            isVisible: true,
            contentData: {
              badge: 'About Zyphex Tech',
              description: 'We are a passionate team of remote technology experts dedicated to transforming businesses through innovative IT solutions. Our mission is to bridge the gap between complex technology and business success.'
            }
          },
          // Our Story Section
          {
            sectionKey: 'story',
            sectionType: 'text-image',
            title: 'Our Story',
            order: 2,
            isVisible: true,
            contentData: {
              paragraphs: [
                'Founded in 2020 with a vision to democratize access to cutting-edge technology solutions, Zyphex Tech has grown from a small team of passionate developers to a comprehensive remote IT services provider serving clients across various industries.',
                'We believe that every business, regardless of size, deserves access to world-class technology solutions. This belief drives us to deliver exceptional value through innovative approaches, transparent communication, and unwavering commitment to quality.'
              ],
              image: '/placeholder.svg?height=500&width=500',
              imageAlt: 'Zyphex Tech Office',
              stats: [
                { value: '50+', label: 'Projects Delivered' },
                { value: '25+', label: 'Happy Clients' },
                { value: '4+', label: 'Years Experience' },
                { value: '98%', label: 'Client Satisfaction' }
              ]
            }
          },
          // Mission, Vision, Values Section
          {
            sectionKey: 'foundation',
            sectionType: 'cards',
            title: 'Our Foundation',
            order: 3,
            isVisible: true,
            contentData: {
              subtitle: 'The principles that guide everything we do',
              cards: [
                {
                  icon: 'Target',
                  title: 'Our Mission',
                  description: 'To empower businesses with innovative remote technology solutions that drive growth, enhance efficiency, and create competitive advantages in the digital landscape.'
                },
                {
                  icon: 'Award',
                  title: 'Our Vision',
                  description: 'To be the leading remote IT services agency recognized for delivering transformative technology solutions that shape the future of business operations worldwide.'
                },
                {
                  icon: 'Heart',
                  title: 'Our Values',
                  description: 'Excellence, integrity, innovation, and client success. We believe in transparent communication, continuous learning, and building long-term partnerships.'
                }
              ]
            }
          },
          // Leadership Team Section
          {
            sectionKey: 'team',
            sectionType: 'team-grid',
            title: 'Meet Our Leadership Team',
            order: 4,
            isVisible: true,
            contentData: {
              subtitle: "The visionaries and experts driving our agency's success",
              members: [
                {
                  name: 'Ishan Garg',
                  role: 'Co-Founder & CTO',
                  image: '/placeholder.svg?height=200&width=200',
                  bio: 'Ishan brings over 8 years of experience in software architecture and cloud solutions. He specializes in scalable system design and leads our technical innovation initiatives.',
                  expertise: ['Cloud Architecture', 'System Design', 'DevOps']
                },
                {
                  name: 'Sumit Malhotra',
                  role: 'Co-Founder & CEO',
                  image: '/placeholder.svg?height=200&width=200',
                  bio: 'Sumit combines business acumen with technical expertise to drive strategic growth. He focuses on client relationships and ensuring our solutions deliver measurable business value.',
                  expertise: ['Business Strategy', 'Client Relations', 'Product Management']
                },
                {
                  name: 'Our Expert Team',
                  role: 'Senior Developers & Consultants',
                  image: '/placeholder.svg?height=200&width=200',
                  bio: 'Our team of senior developers, designers, and consultants brings diverse expertise across multiple technologies and industries to deliver exceptional results.',
                  expertise: ['Full-Stack Development', 'UI/UX Design', 'Quality Assurance']
                }
              ]
            }
          },
          // Technology Stack Section
          {
            sectionKey: 'tech-stack',
            sectionType: 'cards',
            title: 'Our Technology Stack',
            order: 5,
            isVisible: true,
            contentData: {
              subtitle: 'We stay at the forefront of technology to deliver cutting-edge solutions',
              categories: [
                {
                  icon: 'Code',
                  title: 'Frontend Development',
                  technologies: ['React', 'Next.js', 'Vue.js', 'TypeScript', 'Tailwind CSS']
                },
                {
                  icon: 'Database',
                  title: 'Backend & Database',
                  technologies: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis']
                },
                {
                  icon: 'Cloud',
                  title: 'Cloud & DevOps',
                  technologies: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD']
                },
                {
                  icon: 'Smartphone',
                  title: 'Mobile Development',
                  technologies: ['React Native', 'Flutter', 'iOS Native', 'Android Native', 'PWA']
                }
              ]
            }
          },
          // Culture & Values Section
          {
            sectionKey: 'culture',
            sectionType: 'cards',
            title: 'Our Culture & Values',
            order: 6,
            isVisible: true,
            contentData: {
              subtitle: 'What makes our remote team unique and drives our success',
              values: [
                {
                  title: 'Continuous Learning',
                  description: "We invest in our team's growth through regular training, certifications, and conference attendance to stay ahead of technology trends."
                },
                {
                  title: 'Remote Collaboration',
                  description: 'Our distributed team culture encourages knowledge sharing, creative problem-solving, and collective success across time zones.'
                },
                {
                  title: 'Work-Life Balance',
                  description: 'We believe that happy, well-rested team members produce the best work. Flexible schedules and remote work options support this philosophy.'
                },
                {
                  title: 'Innovation Focus',
                  description: 'We allocate time for experimentation and innovation, encouraging our team to explore new technologies and approaches.'
                },
                {
                  title: 'Client-Centric Approach',
                  description: "Every decision we make is guided by what's best for our clients' success and long-term partnership."
                },
                {
                  title: 'Quality Excellence',
                  description: 'We maintain high standards through code reviews, testing protocols, and continuous improvement processes.'
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      sections: true
    }
  })
  console.log(`✅ Created About Page with ${aboutPage.sections.length} sections\n`)

  // ============================================
  // SERVICES PAGE
  // ============================================
  console.log('📄 Creating Services Page...')
  const servicesPage = await prisma.pageContent.create({
    data: {
      pageKey: 'services',
      name: 'Our Services',
      slug: '/services',
      title: 'Remote IT Services & Solutions | Custom Software, Cloud, Mobile Apps',
      description: 'Comprehensive remote IT services including custom software development, cloud migration, mobile app development, data analytics, and IT consulting. Transform your business with Zyphex Tech.',
      status: 'published',
      sections: {
        create: [
          // Hero Section
          {
            sectionKey: 'hero',
            sectionType: 'hero',
            title: 'Comprehensive Remote IT Solutions for Every Business Need',
            order: 1,
            isVisible: true,
            contentData: {
              badge: 'Our Services',
              description: 'From custom software development to cloud migration, we offer a complete suite of remote IT services designed to transform your business and drive sustainable growth.',
              cta: {
                text: 'Get Free Consultation',
                link: '/contact'
              }
            }
          },
          // Services Grid Section (Dynamic)
          {
            sectionKey: 'services-grid',
            sectionType: 'dynamic-content',
            title: 'Our Services',
            order: 2,
            isVisible: true,
            contentData: {
              note: 'Services are fetched from the API at /api/services',
              dataSource: 'API',
              endpoint: '/api/services',
              fallbackMessage: 'Services will be displayed from database'
            }
          },
          // Development Process Section
          {
            sectionKey: 'process',
            sectionType: 'process-steps',
            title: 'Our Development Process',
            order: 3,
            isVisible: true,
            contentData: {
              subtitle: 'A proven methodology that ensures successful project delivery and client satisfaction',
              steps: [
                {
                  number: 1,
                  title: 'Discovery & Planning',
                  description: 'We start by understanding your business goals, challenges, and requirements through comprehensive discussions.'
                },
                {
                  number: 2,
                  title: 'Design & Architecture',
                  description: 'Our team creates detailed technical specifications and user experience designs aligned with your vision.'
                },
                {
                  number: 3,
                  title: 'Development & Testing',
                  description: 'Agile development sprints with regular testing and quality assurance to ensure robust solutions.'
                },
                {
                  number: 4,
                  title: 'Deployment & Support',
                  description: 'Smooth deployment to production with comprehensive documentation and ongoing support.'
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      sections: true
    }
  })
  console.log(`✅ Created Services Page with ${servicesPage.sections.length} sections\n`)

  // ============================================
  // UPDATES PAGE
  // ============================================
  console.log('📄 Creating Updates Page...')
  const updatesPage = await prisma.pageContent.create({
    data: {
      pageKey: 'updates',
      name: 'Updates & Blog',
      slug: '/updates',
      title: 'Technology Insights & Updates | Zyphex Tech Blog',
      description: 'Stay informed with the latest technology trends, best practices, and expert insights. Read our blog for valuable information on remote IT solutions, cloud computing, AI, and more.',
      status: 'published',
      sections: {
        create: [
          // Hero Section
          {
            sectionKey: 'hero',
            sectionType: 'hero',
            title: 'Stay Ahead with Technology Insights',
            order: 1,
            isVisible: true,
            contentData: {
              badge: 'Latest Updates & Insights',
              description: 'Discover the latest trends, best practices, and expert insights in remote technology. Our team shares knowledge to help you make informed decisions for your business.',
              hasSearch: true
            }
          },
          // Category Filter Section
          {
            sectionKey: 'categories',
            sectionType: 'filter-bar',
            title: 'Categories',
            order: 2,
            isVisible: true,
            contentData: {
              categories: [
                'All',
                'Remote Work',
                'Artificial Intelligence',
                'Security',
                'Web Development',
                'Database',
                'Mobile Development',
                'DevOps',
                'E-commerce'
              ]
            }
          },
          // Blog Grid Section (Dynamic)
          {
            sectionKey: 'blog-grid',
            sectionType: 'dynamic-content',
            title: 'Featured Articles',
            order: 3,
            isVisible: true,
            contentData: {
              note: 'Blog posts are fetched from the API at /api/content?type=Blog',
              dataSource: 'API',
              endpoint: '/api/content?type=Blog',
              fallbackMessage: 'Blog posts will be displayed from database'
            }
          }
        ]
      }
    },
    include: {
      sections: true
    }
  })
  console.log(`✅ Created Updates Page with ${updatesPage.sections.length} sections\n`)

  // ============================================
  // CONTACT PAGE
  // ============================================
  console.log('📄 Creating Contact Page...')
  const contactPage = await prisma.pageContent.create({
    data: {
      pageKey: 'contact',
      name: 'Contact Us',
      slug: '/contact',
      title: 'Contact Zyphex Tech - Get Free IT Consultation | Remote IT Services',
      description: 'Get in touch with Zyphex Tech for a free consultation. Contact us to discuss your IT project, request a quote, or learn more about our remote IT solutions and services.',
      status: 'published',
      sections: {
        create: [
          // Hero Section
          {
            sectionKey: 'hero',
            sectionType: 'hero',
            title: "Let's Build Something Amazing Together",
            order: 1,
            isVisible: true,
            contentData: {
              badge: 'Get In Touch',
              description: "Ready to transform your business with cutting-edge remote technology? We're here to help. Get in touch for a free consultation and discover how we can drive your success."
            }
          },
          // Contact Info Section
          {
            sectionKey: 'contact-info',
            sectionType: 'contact-cards',
            title: 'Contact Information',
            order: 2,
            isVisible: true,
            contentData: {
              methods: [
                {
                  icon: 'Mail',
                  title: 'Email Us',
                  primary: 'hello@zyphextech.com',
                  secondary: 'support@zyphextech.com',
                  description: 'Send us an email anytime'
                },
                {
                  icon: 'Phone',
                  title: 'Call Us',
                  primary: '+1 (555) 123-4567',
                  secondary: '+1 (555) 987-6543',
                  description: 'Mon-Fri 9AM-6PM EST'
                },
                {
                  icon: 'MapPin',
                  title: 'Visit Us',
                  primary: 'Remote First Agency',
                  secondary: 'Serving clients worldwide',
                  description: 'Schedule a virtual meeting'
                },
                {
                  icon: 'Clock',
                  title: 'Business Hours',
                  primary: 'Monday - Friday',
                  secondary: '9:00 AM - 6:00 PM EST',
                  description: '24/7 Emergency Support'
                }
              ]
            }
          },
          // Contact Form Section
          {
            sectionKey: 'contact-form',
            sectionType: 'form',
            title: 'Send Us a Message',
            order: 3,
            isVisible: true,
            contentData: {
              note: 'Form component handles submission to /api/contact',
              fields: ['firstName', 'lastName', 'email', 'phone', 'company', 'service', 'budget', 'message'],
              services: [
                'Custom Software Development',
                'Cloud Solutions & Migration',
                'Data Analytics & BI',
                'Mobile App Development',
                'IT Consulting & Strategy',
                'Dedicated Development Teams',
                'Other'
              ]
            }
          },
          // Additional Info Section
          {
            sectionKey: 'additional-info',
            sectionType: 'cards',
            title: 'More Ways to Connect',
            order: 4,
            isVisible: true,
            contentData: {
              socialLinks: [
                {
                  platform: 'LinkedIn',
                  url: 'https://linkedin.com/company/zyphextech'
                },
                {
                  platform: 'Twitter',
                  url: 'https://twitter.com/zyphextech'
                },
                {
                  platform: 'GitHub',
                  url: 'https://github.com/zyphextech'
                }
              ],
              additionalInfo: 'We typically respond to all inquiries within 24 hours during business days.'
            }
          }
        ]
      }
    },
    include: {
      sections: true
    }
  })
  console.log(`✅ Created Contact Page with ${contactPage.sections.length} sections\n`)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('📊 Migration Summary:')
  console.log('═══════════════════════════════════════')
  console.log(`✅ Total Pages Created: 5`)
  console.log(`   - Home: ${homePage.sections.length} sections`)
  console.log(`   - About: ${aboutPage.sections.length} sections`)
  console.log(`   - Services: ${servicesPage.sections.length} sections`)
  console.log(`   - Updates: ${updatesPage.sections.length} sections`)
  console.log(`   - Contact: ${contactPage.sections.length} sections`)
  console.log(`✅ Total Sections Created: ${homePage.sections.length + aboutPage.sections.length + servicesPage.sections.length + updatesPage.sections.length + contactPage.sections.length}`)
  console.log('═══════════════════════════════════════')
  console.log('🎉 Content migration seed completed successfully!\n')
  console.log('Next steps:')
  console.log('1. Open Prisma Studio: npx prisma studio')
  console.log('2. Verify PageContent table has 5 pages')
  console.log('3. Verify PageContentSection table has all sections')
  console.log('4. Check that all JSON data is properly formatted\n')
}

main()
  .catch((e: Error) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
