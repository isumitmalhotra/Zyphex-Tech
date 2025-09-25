import { prisma } from '../lib/prisma'

async function createSampleContentSections() {
  try {
    console.log('Creating sample content sections...')

    const contentSections = [
      {
        sectionKey: "hero",
        title: "Transform Your Business with Remote Excellence",
        subtitle: "Leading Remote IT Solutions Provider",
        content: JSON.stringify({
          description: "Zyphex Tech delivers innovative technology solutions through expert remote teams. From custom software to cloud migration, we drive growth and efficiency from anywhere in the world.",
          ctaText: "Get Free Consultation",
          ctaSecondary: "View Our Work"
        }),
        imageUrl: "/images/hero-bg.jpg",
        isActive: true,
        order: 1,
      },
      {
        sectionKey: "about",
        title: "About ZyphexTech",
        subtitle: "Your Trusted Technology Partner",
        content: JSON.stringify({
          description: "We are a forward-thinking technology company specializing in remote IT solutions. Our team of experts delivers cutting-edge software development, cloud migration, and digital transformation services to businesses worldwide.",
          features: [
            "Expert Remote Teams",
            "24/7 Support",
            "Agile Development",
            "Proven Track Record"
          ]
        }),
        imageUrl: "/images/about-us.jpg",
        isActive: true,
        order: 2,
      },
      {
        sectionKey: "services-intro",
        title: "Our Services",
        subtitle: "Comprehensive IT Solutions",
        content: JSON.stringify({
          description: "We offer a full spectrum of technology services designed to accelerate your business growth and digital transformation journey."
        }),
        isActive: true,
        order: 3,
      },
      {
        sectionKey: "why-choose-us",
        title: "Why Choose ZyphexTech",
        subtitle: "Excellence in Every Project",
        content: JSON.stringify({
          reasons: [
            {
              title: "Expert Team",
              description: "Highly skilled professionals with years of experience",
              icon: "Users"
            },
            {
              title: "Remote First",
              description: "Seamless collaboration from anywhere in the world",
              icon: "Globe"
            },
            {
              title: "Quality Assured",
              description: "Rigorous testing and quality control processes",
              icon: "CheckCircle"
            },
            {
              title: "24/7 Support",
              description: "Round-the-clock support and maintenance",
              icon: "Clock"
            }
          ]
        }),
        isActive: true,
        order: 4,
      },
      {
        sectionKey: "cta",
        title: "Ready to Get Started?",
        subtitle: "Let's Build Something Amazing Together",
        content: JSON.stringify({
          description: "Contact us today to discuss your project and see how we can help transform your business with cutting-edge technology solutions.",
          ctaText: "Start Your Project",
          ctaSecondary: "Schedule a Call"
        }),
        isActive: true,
        order: 5,
      }
    ]

    for (const section of contentSections) {
      const existing = await prisma.contentSection.findUnique({
        where: { sectionKey: section.sectionKey }
      })

      if (existing) {
        console.log(`Content section already exists: ${section.sectionKey}`)
        continue
      }

      await prisma.contentSection.create({
        data: section
      })

      console.log(`Created content section: ${section.sectionKey}`)
    }

    console.log('Sample content sections creation completed!')

  } catch (error) {
    console.error('Error creating sample content sections:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleContentSections()