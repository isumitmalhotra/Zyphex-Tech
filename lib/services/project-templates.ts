import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define ProjectMethodology enum locally since it might not be exported
type ProjectMethodology = 'AGILE' | 'WATERFALL' | 'SCRUM' | 'KANBAN' | 'HYBRID'

export interface TaskTemplate {
  title: string
  description: string
  estimatedHours: number
  skillsRequired: string[]
}

export interface MilestoneTemplate {
  title: string
  description: string
  daysFromStart: number
}

export interface RiskTemplate {
  title: string
  category: string
  impactScore: number
  probabilityScore: number
  description: string
}

export interface BudgetTemplate {
  category: string
  name: string
  budgetPercentage: number
}

export interface ProjectTemplateData {
  name: string
  description?: string
  methodology: ProjectMethodology
  industry?: string
  estimatedDuration?: number
  tasksTemplate?: TaskTemplate[]
  milestonesTemplate?: MilestoneTemplate[]
  riskTemplate?: RiskTemplate[]
  resourceTemplate?: unknown[]
  budgetTemplate?: BudgetTemplate[]
}

export const defaultTemplates: ProjectTemplateData[] = [
  {
    name: "Web Application Development (Agile)",
    description: "Complete web application development using Agile methodology",
    methodology: "AGILE",
    industry: "Software Development",
    estimatedDuration: 90,
    tasksTemplate: [
      {
        title: "Project Setup & Planning",
        description: "Initial project setup, requirements gathering, and sprint planning",
        estimatedHours: 16,
        skillsRequired: ["Project Management", "Requirements Analysis"]
      },
      {
        title: "UI/UX Design",
        description: "Create wireframes, mockups, and user interface designs",
        estimatedHours: 40,
        skillsRequired: ["UI/UX Design", "Figma", "Adobe Creative Suite"]
      },
      {
        title: "Frontend Development",
        description: "Implement responsive frontend using modern frameworks",
        estimatedHours: 80,
        skillsRequired: ["React", "TypeScript", "CSS", "HTML"]
      },
      {
        title: "Backend Development",
        description: "Build APIs, database integration, and server-side logic",
        estimatedHours: 70,
        skillsRequired: ["Node.js", "Database Design", "API Development"]
      },
      {
        title: "Testing & QA",
        description: "Unit testing, integration testing, and quality assurance",
        estimatedHours: 30,
        skillsRequired: ["Testing", "QA", "Jest", "Cypress"]
      },
      {
        title: "Deployment & Launch",
        description: "Production deployment and launch preparation",
        estimatedHours: 24,
        skillsRequired: ["DevOps", "Cloud Deployment", "CI/CD"]
      }
    ],
    milestonesTemplate: [
      {
        title: "Project Kickoff",
        description: "Project officially started with team alignment",
        daysFromStart: 1
      },
      {
        title: "Design Approval",
        description: "UI/UX designs approved by stakeholders",
        daysFromStart: 21
      },
      {
        title: "MVP Release",
        description: "Minimum viable product ready for testing",
        daysFromStart: 60
      },
      {
        title: "Production Launch",
        description: "Application deployed to production",
        daysFromStart: 90
      }
    ],
    riskTemplate: [
      {
        title: "Scope Creep",
        category: "Project Management",
        impactScore: 8,
        probabilityScore: 6,
        description: "Requirements may expand beyond initial scope"
      },
      {
        title: "Technology Learning Curve",
        category: "Technical",
        impactScore: 6,
        probabilityScore: 4,
        description: "Team may need time to learn new technologies"
      }
    ]
  },
  {
    name: "Mobile App Development (Scrum)",
    description: "Cross-platform mobile application development using Scrum framework",
    methodology: "SCRUM",
    industry: "Mobile Development",
    estimatedDuration: 120,
    tasksTemplate: [
      {
        title: "Sprint 0 - Setup",
        description: "Project setup, team formation, and initial planning",
        estimatedHours: 20,
        skillsRequired: ["Project Management", "Scrum Master"]
      },
      {
        title: "App Architecture Design",
        description: "Design mobile app architecture and technical stack",
        estimatedHours: 30,
        skillsRequired: ["Mobile Architecture", "System Design"]
      },
      {
        title: "Cross-Platform Development",
        description: "Develop mobile app using React Native or Flutter",
        estimatedHours: 100,
        skillsRequired: ["React Native", "Flutter", "Mobile Development"]
      },
      {
        title: "API Integration",
        description: "Integrate mobile app with backend APIs",
        estimatedHours: 40,
        skillsRequired: ["API Integration", "REST", "GraphQL"]
      },
      {
        title: "Testing & Performance",
        description: "Mobile testing, performance optimization, and device compatibility",
        estimatedHours: 35,
        skillsRequired: ["Mobile Testing", "Performance Optimization"]
      },
      {
        title: "App Store Deployment",
        description: "Prepare and deploy to App Store and Google Play",
        estimatedHours: 25,
        skillsRequired: ["App Store Deployment", "Mobile DevOps"]
      }
    ]
  },
  {
    name: "Enterprise System Integration (Waterfall)",
    description: "Large-scale enterprise system integration using Waterfall methodology",
    methodology: "WATERFALL",
    industry: "Enterprise",
    estimatedDuration: 180,
    tasksTemplate: [
      {
        title: "Requirements Analysis",
        description: "Comprehensive requirements gathering and documentation",
        estimatedHours: 60,
        skillsRequired: ["Business Analysis", "Requirements Engineering"]
      },
      {
        title: "System Design",
        description: "Detailed system architecture and design documentation",
        estimatedHours: 80,
        skillsRequired: ["System Architecture", "Enterprise Design"]
      },
      {
        title: "Implementation",
        description: "System development and integration implementation",
        estimatedHours: 200,
        skillsRequired: ["Enterprise Development", "System Integration"]
      },
      {
        title: "Testing Phase",
        description: "Comprehensive testing including UAT",
        estimatedHours: 60,
        skillsRequired: ["Enterprise Testing", "UAT", "System Testing"]
      },
      {
        title: "Deployment",
        description: "Production deployment and go-live activities",
        estimatedHours: 40,
        skillsRequired: ["Enterprise Deployment", "Production Support"]
      }
    ]
  }
]

// Simplified ProjectTemplateService that works with current schema
export class ProjectTemplateService {
  
  // Get all templates (for now, return default templates)
  async getAllTemplates(): Promise<ProjectTemplateData[]> {
    // TODO: When ProjectTemplate model is available, query from database
    return defaultTemplates
  }

  // Get template by name
  async getTemplateByName(name: string): Promise<ProjectTemplateData | null> {
    return defaultTemplates.find(t => t.name === name) || null
  }

  // Get templates by methodology
  async getTemplatesByMethodology(methodology: ProjectMethodology): Promise<ProjectTemplateData[]> {
    return defaultTemplates.filter(t => t.methodology === methodology)
  }

  // Create a basic project from template (simplified version)
  async createProjectFromTemplate(
    templateName: string,
    projectData: {
      projectName: string
      description?: string
      clientId: string
      startDate: Date
      expectedEndDate?: Date
      budget?: number
      priority?: string
      createdBy?: string
    }
  ) {
    const template = await this.getTemplateByName(templateName)
    
    if (!template) {
      throw new Error(`Template "${templateName}" not found`)
    }

    try {
      // Create basic project with current schema
      const project = await prisma.project.create({
        data: {
          name: projectData.projectName,
          description: projectData.description || template.description || '',
          status: 'PLANNING',
          priority: (projectData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
          budget: projectData.budget || 0,
          hourlyRate: 100,
          startDate: projectData.startDate,
          endDate: projectData.expectedEndDate,
          clientId: projectData.clientId,
          estimatedHours: this.calculateTotalHours(template.tasksTemplate || [])
        },
        include: {
          client: true,
          tasks: true
        }
      })

      // Create tasks from template
      if (template.tasksTemplate && projectData.createdBy) {
        for (const [index, taskTemplate] of template.tasksTemplate.entries()) {
          await prisma.task.create({
            data: {
              title: taskTemplate.title,
              description: taskTemplate.description,
              status: 'TODO',
              priority: 'MEDIUM',
              estimatedHours: taskTemplate.estimatedHours,
              projectId: project.id,
              createdBy: projectData.createdBy,
              order: index + 1
            }
          })
        }
      }

      // TODO: Create milestones and risks when models are available
      
      return project

    } catch (error) {
      throw error
    }
  }

  // Helper method to calculate total hours
  private calculateTotalHours(tasks: TaskTemplate[]): number {
    return tasks.reduce((total, task) => total + task.estimatedHours, 0)
  }

  // Store a template (simplified - just add to defaults for now)
  async createTemplate(templateData: ProjectTemplateData): Promise<ProjectTemplateData> {
    // TODO: When ProjectTemplate model is available, store in database
    defaultTemplates.push(templateData)
    return templateData
  }
}