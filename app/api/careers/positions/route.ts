import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Mock job positions data (same as in frontend)
const jobPositions = [
  {
    id: "1",
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$100k - $140k",
    description: "Join our engineering team to build scalable web applications using modern technologies.",
    requirements: ["5+ years experience", "React/Next.js", "Node.js", "TypeScript", "AWS/Cloud"],
    responsibilities: ["Build and maintain web applications", "Collaborate with design team", "Code reviews", "Mentor junior developers"],
    postedDate: "2024-10-15"
  },
  {
    id: "2",
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$80k - $110k",
    description: "Create beautiful and intuitive user experiences for our platform and clients.",
    requirements: ["3+ years experience", "Figma/Sketch", "Design systems", "User research", "Prototyping"],
    responsibilities: ["Design user interfaces", "Conduct user research", "Create design systems", "Collaborate with developers"],
    postedDate: "2024-10-10"
  },
  {
    id: "3",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$95k - $130k",
    description: "Build and maintain our cloud infrastructure and deployment pipelines.",
    requirements: ["4+ years experience", "AWS/Azure", "Docker/Kubernetes", "CI/CD", "Terraform"],
    responsibilities: ["Manage cloud infrastructure", "Automate deployments", "Monitor system performance", "Security implementation"],
    postedDate: "2024-10-12"
  },
  {
    id: "4",
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$110k - $150k",
    description: "Lead product strategy and roadmap for our innovative platform.",
    requirements: ["5+ years experience", "Product strategy", "Agile/Scrum", "Data analysis", "Stakeholder management"],
    responsibilities: ["Define product vision", "Manage roadmap", "Coordinate with teams", "Analyze metrics"],
    postedDate: "2024-10-08"
  },
  {
    id: "5",
    title: "Frontend Developer",
    department: "Engineering",
    location: "Remote",
    type: "Contract",
    remote: true,
    salary: "$70 - $100/hr",
    description: "Build responsive and performant user interfaces for client projects.",
    requirements: ["3+ years experience", "React", "CSS/Tailwind", "JavaScript/TypeScript", "Responsive design"],
    responsibilities: ["Develop UI components", "Implement designs", "Optimize performance", "Write tests"],
    postedDate: "2024-10-18"
  },
  {
    id: "6",
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$85k - $120k",
    description: "Drive marketing strategy and growth initiatives for Zyphex Tech.",
    requirements: ["4+ years experience", "Digital marketing", "SEO/SEM", "Content strategy", "Analytics"],
    responsibilities: ["Develop marketing strategy", "Manage campaigns", "Analyze performance", "Lead content creation"],
    postedDate: "2024-10-05"
  }
]

/**
 * @swagger
 * /api/careers/positions:
 *   get:
 *     summary: Get all open job positions
 *     description: Retrieve list of all open positions at Zyphex Tech
 *     tags:
 *       - Careers
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Full-time, Part-time, Contract]
 *         description: Filter by job type
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *         description: Filter remote positions
 *     responses:
 *       200:
 *         description: List of job positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const location = searchParams.get('location')
    const type = searchParams.get('type')
    const remote = searchParams.get('remote')

    // Filter positions based on query parameters
    let filteredPositions = [...jobPositions]

    if (department && department !== 'all') {
      filteredPositions = filteredPositions.filter(p => p.department === department)
    }

    if (location && location !== 'all') {
      filteredPositions = filteredPositions.filter(p => p.location === location)
    }

    if (type && type !== 'all') {
      filteredPositions = filteredPositions.filter(p => p.type === type)
    }

    if (remote === 'true') {
      filteredPositions = filteredPositions.filter(p => p.remote)
    }

    return NextResponse.json({
      success: true,
      count: filteredPositions.length,
      positions: filteredPositions
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}
