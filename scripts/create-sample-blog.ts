import { prisma } from '../lib/prisma'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

async function createSampleBlogPosts() {
  try {
    console.log('Creating sample blog posts...')

    const blogPosts = [
      {
        title: "The Future of Remote Work: Technology Trends for 2025",
        excerpt: "Explore the latest technology trends shaping the future of remote work and how businesses can adapt to the new digital landscape.",
        content: `# The Future of Remote Work: Technology Trends for 2025

The landscape of remote work continues to evolve rapidly, driven by technological innovations and changing business needs. As we look ahead to 2025, several key trends are emerging that will shape how teams collaborate and businesses operate in a distributed world.

## Cloud-First Infrastructure

Organizations are increasingly adopting cloud-first strategies to support their remote workforce. This includes:

- **Multi-cloud environments** for improved reliability and performance
- **Edge computing** to reduce latency for remote workers
- **Zero-trust security models** to protect distributed teams

## AI-Powered Collaboration Tools

Artificial intelligence is revolutionizing how remote teams work together:

- **Smart meeting assistants** that transcribe and summarize discussions
- **Automated project management** with intelligent task allocation
- **Real-time language translation** for global teams

## Virtual and Augmented Reality

Immersive technologies are bridging the gap between remote and in-person collaboration:

- **Virtual offices** that recreate the physical workspace experience
- **AR-enhanced presentations** for more engaging remote meetings
- **3D collaboration spaces** for design and engineering teams

## Conclusion

The future of remote work is bright, with technology continuing to break down barriers and create new possibilities for collaboration. Organizations that embrace these trends will be best positioned to attract top talent and drive innovation in the years ahead.`,
        author: "Sarah Johnson",
        imageUrl: "/images/blog/remote-work-future.jpg",
        tags: JSON.stringify(["remote work", "technology", "future", "AI", "cloud"]),
        published: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: "Building Scalable Web Applications with Modern Architecture",
        excerpt: "Learn how to design and build web applications that can scale to millions of users using modern architectural patterns and cloud technologies.",
        content: `# Building Scalable Web Applications with Modern Architecture

Creating web applications that can handle massive scale requires careful planning and the right architectural decisions from the start. In this post, we'll explore the key principles and technologies that enable truly scalable web applications.

## Microservices Architecture

Breaking down monolithic applications into smaller, independent services offers several advantages:

- **Independent scaling** of different components
- **Technology diversity** - use the right tool for each job
- **Fault isolation** - failures in one service don't bring down the entire system
- **Team autonomy** - different teams can work on different services

## Database Strategy

Choosing the right database strategy is crucial for scalability:

- **Database sharding** to distribute data across multiple instances
- **Read replicas** to handle high read loads
- **Caching strategies** with Redis or Memcached
- **Event sourcing** for audit trails and data consistency

## Load Balancing and CDNs

Distributing traffic effectively is essential:

- **Application load balancers** for dynamic content
- **Content delivery networks** for static assets
- **Geographic distribution** to serve users globally
- **Auto-scaling** based on demand

## Monitoring and Observability

You can't improve what you can't measure:

- **Application performance monitoring**
- **Distributed tracing** across services
- **Real-time alerting** for critical issues
- **Capacity planning** based on usage patterns

Building scalable applications is both an art and a science, requiring the right combination of technology choices and operational practices.`,
        author: "Michael Chen",
        imageUrl: "/images/blog/scalable-architecture.jpg",
        tags: JSON.stringify(["web development", "architecture", "scalability", "microservices", "cloud"]),
        published: true,
        publishedAt: new Date('2024-02-20'),
      },
      {
        title: "Cybersecurity Best Practices for Remote Teams",
        excerpt: "Essential security measures and best practices to protect your remote workforce and sensitive business data in today's threat landscape.",
        content: `# Cybersecurity Best Practices for Remote Teams

As remote work becomes the norm, cybersecurity challenges have multiplied. Organizations must adapt their security strategies to protect distributed teams and sensitive data. Here are the essential practices every remote team should implement.

## Zero Trust Security Model

The traditional perimeter-based security model is obsolete in a remote work environment:

- **Verify every user and device** before granting access
- **Implement least privilege access** - users get only what they need
- **Continuous monitoring** of user behavior and network activity
- **Multi-factor authentication** for all systems and applications

## Secure Communication

Protecting communications is critical for remote teams:

- **End-to-end encryption** for all messaging and video calls
- **VPN connections** for accessing company resources
- **Secure file sharing** platforms with access controls
- **Regular security training** for all team members

## Device Management

Managing and securing remote devices requires:

- **Mobile device management (MDM)** solutions
- **Regular security updates** and patch management
- **Endpoint detection and response** tools
- **Data loss prevention** measures

## Incident Response

Being prepared for security incidents:

- **Incident response plans** tailored for remote teams
- **Regular security drills** and simulations
- **Clear communication channels** for reporting incidents
- **Backup and recovery procedures** for critical data

Remote work security is an ongoing process that requires vigilance, proper tools, and a security-first culture throughout the organization.`,
        author: "David Rodriguez",
        imageUrl: "/images/blog/cybersecurity-remote.jpg",
        tags: JSON.stringify(["cybersecurity", "remote work", "best practices", "security", "data protection"]),
        published: true,
        publishedAt: new Date('2024-03-10'),
      }
    ]

    for (const post of blogPosts) {
      const slug = generateSlug(post.title)
      
      const existing = await prisma.blogPost.findUnique({
        where: { slug }
      })

      if (existing) {
        console.log(`Blog post already exists: ${post.title}`)
        continue
      }

      await prisma.blogPost.create({
        data: {
          ...post,
          slug
        }
      })

      console.log(`Created blog post: ${post.title}`)
    }

    console.log('Sample blog posts creation completed!')

  } catch (error) {
    console.error('Error creating sample blog posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleBlogPosts()