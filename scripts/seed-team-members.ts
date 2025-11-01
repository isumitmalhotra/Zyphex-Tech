import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTeamMembers() {
  console.log('👥 Seeding team members...\n')

  try {
    // Find or create team_member content type
    let teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })

    if (!teamMemberType) {
      teamMemberType = await prisma.contentType.create({
        data: {
          name: 'team_member',
          label: 'Team Members',
          description: 'Company team members and staff',
          icon: 'Users',
          fields: JSON.stringify([
            { name: 'role', label: 'Role/Position', type: 'text', required: true },
            { name: 'bio', label: 'Biography', type: 'textarea', required: true },
            { name: 'imageUrl', label: 'Profile Photo', type: 'image', required: true },
            { name: 'email', label: 'Email', type: 'email', required: false },
            { name: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false },
            { name: 'twitter', label: 'Twitter Handle', type: 'text', required: false },
            { name: 'github', label: 'GitHub Username', type: 'text', required: false },
            { name: 'specialties', label: 'Specialties', type: 'array', required: false },
            { name: 'yearsExperience', label: 'Years of Experience', type: 'number', required: false }
          ]),
          category: 'content',
          isSystem: false,
          isActive: true,
          allowMultiple: true
        }
      })
      console.log('✅ Created team_member content type')
    }

    // Team members data
    const teamMembers = [
      {
        title: 'Sumit Malhotra',
        slug: 'sumit-malhotra',
        data: {
          role: 'Founder & CEO',
          bio: 'Visionary technology leader with over 10 years of experience in building innovative IT solutions. Passionate about leveraging technology to solve complex business challenges and drive digital transformation.',
          imageUrl: '/images/team/sumit-malhotra.jpg',
          email: 'sumit@zyphextech.com',
          linkedin: 'https://linkedin.com/in/sumitmalhotra',
          specialties: ['Strategic Planning', 'Digital Transformation', 'Enterprise Architecture', 'Business Development'],
          yearsExperience: 10
        },
        categories: ['Leadership', 'Executive'],
        tags: ['CEO', 'Founder', 'Leadership'],
        featured: true,
        order: 1
      },
      {
        title: 'Priya Sharma',
        slug: 'priya-sharma',
        data: {
          role: 'Chief Technology Officer',
          bio: 'Technology expert specializing in cloud architecture and DevOps. Leads technical strategy and ensures delivery of cutting-edge solutions to clients across various industries.',
          imageUrl: '/images/team/priya-sharma.jpg',
          email: 'priya@zyphextech.com',
          linkedin: 'https://linkedin.com/in/priyasharma',
          github: 'priyasharma-dev',
          specialties: ['Cloud Architecture', 'DevOps', 'System Design', 'Technical Leadership'],
          yearsExperience: 8
        },
        categories: ['Leadership', 'Engineering'],
        tags: ['CTO', 'Cloud', 'DevOps'],
        featured: true,
        order: 2
      },
      {
        title: 'Rahul Verma',
        slug: 'rahul-verma',
        data: {
          role: 'Lead Full-Stack Developer',
          bio: 'Full-stack development expert with a passion for creating elegant, scalable solutions. Specializes in modern JavaScript frameworks and cloud-native applications.',
          imageUrl: '/images/team/rahul-verma.jpg',
          email: 'rahul@zyphextech.com',
          linkedin: 'https://linkedin.com/in/rahulverma',
          github: 'rahulverma-dev',
          twitter: '@rahulverma_dev',
          specialties: ['React', 'Node.js', 'TypeScript', 'Next.js', 'Cloud Architecture'],
          yearsExperience: 7
        },
        categories: ['Engineering', 'Development'],
        tags: ['Full-Stack', 'React', 'Node.js'],
        featured: true,
        order: 3
      },
      {
        title: 'Ananya Patel',
        slug: 'ananya-patel',
        data: {
          role: 'Senior UX/UI Designer',
          bio: 'Creative designer focused on crafting intuitive and beautiful user experiences. Combines design thinking with user research to deliver exceptional digital products.',
          imageUrl: '/images/team/ananya-patel.jpg',
          email: 'ananya@zyphextech.com',
          linkedin: 'https://linkedin.com/in/ananyapatel',
          twitter: '@ananya_designs',
          specialties: ['UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Figma'],
          yearsExperience: 6
        },
        categories: ['Design', 'Creative'],
        tags: ['UX', 'UI', 'Design'],
        featured: true,
        order: 4
      },
      {
        title: 'Vikram Singh',
        slug: 'vikram-singh',
        data: {
          role: 'Senior DevOps Engineer',
          bio: 'Infrastructure and automation specialist with deep expertise in CI/CD, containerization, and cloud platforms. Ensures reliable and scalable deployments for all projects.',
          imageUrl: '/images/team/vikram-singh.jpg',
          email: 'vikram@zyphextech.com',
          linkedin: 'https://linkedin.com/in/vikramsingh',
          github: 'vikram-devops',
          specialties: ['Kubernetes', 'Docker', 'CI/CD', 'AWS', 'Terraform', 'Monitoring'],
          yearsExperience: 7
        },
        categories: ['Engineering', 'DevOps'],
        tags: ['DevOps', 'Infrastructure', 'Cloud'],
        featured: false,
        order: 5
      },
      {
        title: 'Neha Kapoor',
        slug: 'neha-kapoor',
        data: {
          role: 'Project Manager',
          bio: 'Experienced project manager skilled in agile methodologies and client relationship management. Ensures projects are delivered on time, within budget, and exceed client expectations.',
          imageUrl: '/images/team/neha-kapoor.jpg',
          email: 'neha@zyphextech.com',
          linkedin: 'https://linkedin.com/in/nehakapoor',
          specialties: ['Agile/Scrum', 'Project Planning', 'Stakeholder Management', 'Risk Management'],
          yearsExperience: 6
        },
        categories: ['Management', 'Operations'],
        tags: ['PM', 'Agile', 'Scrum'],
        featured: false,
        order: 6
      }
    ]

    // Create team members
    for (const member of teamMembers) {
      const existingMember = await prisma.dynamicContentItem.findFirst({
        where: {
          contentTypeId: teamMemberType.id,
          slug: member.slug
        }
      })

      if (!existingMember) {
        await prisma.dynamicContentItem.create({
          data: {
            contentTypeId: teamMemberType.id,
            title: member.title,
            slug: member.slug,
            data: JSON.stringify(member.data),
            status: 'PUBLISHED',
            featured: member.featured,
            publishedAt: new Date(),
            order: member.order,
            categories: JSON.stringify(member.categories),
            tags: JSON.stringify(member.tags)
          }
        })
        console.log(`✅ Created team member: ${member.title} - ${member.data.role}`)
      } else {
        console.log(`⏭️  Skipped existing team member: ${member.title}`)
      }
    }

    console.log('\n🎉 Team members seeding completed successfully!')

    // Display summary
    const totalMembers = await prisma.dynamicContentItem.count({
      where: { contentTypeId: teamMemberType.id }
    })
    const featuredMembers = await prisma.dynamicContentItem.count({
      where: { 
        contentTypeId: teamMemberType.id,
        featured: true 
      }
    })
    
    console.log(`\n📊 Total team members: ${totalMembers} (${featuredMembers} featured)`)

  } catch (error) {
    console.error('❌ Error seeding team members:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTeamMembers()
