import { test, expect } from '@playwright/test'
import { loginAsProjectManager } from './helpers'

/**
 * E2E Tests - Project Management Workflow
 */

test.describe('Project Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as project manager before each test
    await loginAsProjectManager(page)
  })

  test('create new project workflow', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/project-manager/projects')

    // Click create project button
    await page.click('button:has-text("New Project")')

    // Fill in project form
    await page.fill('input[name="name"]', `E2E Test Project ${Date.now()}`)
    await page.fill('textarea[name="description"]', 'Test project created via E2E test')

    // Select client
    await page.click('[data-testid="client-select"]')
    await page.click('[role="option"]:first-child')

    // Set dates
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await page.fill('input[name="startDate"]', startDate)
    await page.fill('input[name="endDate"]', endDate)

    // Set budget
    await page.fill('input[name="budget"]', '50000')

    // Set priority
    await page.click('[data-testid="priority-select"]')
    await page.click('text=High')

    // Set status
    await page.click('[data-testid="status-select"]')
    await page.click('text=Planning')

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Project")')

    // Should show success message
    await expect(page.locator('text=project created successfully')).toBeVisible()

    // Should see new project in list
    await expect(page.locator(`text=E2E Test Project`)).toBeVisible()
  })

  test('add tasks to project', async ({ page }) => {
    await page.goto('/project-manager/projects')

    // Click on first project
    await page.click('[data-testid="project-card"]:first-child')

    // Navigate to tasks tab
    await page.click('button:has-text("Tasks")')

    // Click add task
    await page.click('button:has-text("Add Task")')

    // Fill task form
    await page.fill('input[name="title"]', 'E2E Test Task')
    await page.fill('textarea[name="description"]', 'Test task description')

    // Set due date
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await page.fill('input[name="dueDate"]', dueDate)

    // Set priority
    await page.click('[data-testid="task-priority-select"]')
    await page.click('text=Medium')

    // Assign to team member
    await page.click('[data-testid="assignee-select"]')
    await page.click('[role="option"]:first-child')

    // Submit task
    await page.click('button[type="submit"]:has-text("Add Task")')

    // Should show success
    await expect(page.locator('text=task added')).toBeVisible()

    // Should see task in list
    await expect(page.locator('text=E2E Test Task')).toBeVisible()
  })

  test('update project status', async ({ page }) => {
    await page.goto('/project-manager/projects')

    // Click on project
    await page.click('[data-testid="project-card"]:first-child')

    // Click edit button
    await page.click('[data-testid="edit-project"]')

    // Change status
    await page.click('[data-testid="status-select"]')
    await page.click('text=In Progress')

    // Update progress
    await page.fill('input[name="progress"]', '35')

    // Save changes
    await page.click('button:has-text("Save Changes")')

    // Should show success
    await expect(page.locator('text=project updated')).toBeVisible()

    // Should see updated status
    await expect(page.locator('text=In Progress')).toBeVisible()
  })

  test('assign team members to project', async ({ page }) => {
    await page.goto('/project-manager/projects')

    // Open project
    await page.click('[data-testid="project-card"]:first-child')

    // Navigate to team tab
    await page.click('button:has-text("Team")')

    // Click add member
    await page.click('button:has-text("Add Team Member")')

    // Select user
    await page.click('[data-testid="user-select"]')
    await page.click('[role="option"]:first-child')

    // Set role
    await page.click('[data-testid="role-select"]')
    await page.click('text=Developer')

    // Set allocation
    await page.fill('input[name="hoursPerWeek"]', '40')

    // Submit
    await page.click('button[type="submit"]:has-text("Add Member")')

    // Should show success
    await expect(page.locator('text=member added')).toBeVisible()
  })

  test('track project progress with milestones', async ({ page }) => {
    await page.goto('/project-manager/projects')

    // Open project
    await page.click('[data-testid="project-card"]:first-child')

    // Navigate to milestones
    await page.click('button:has-text("Milestones")')

    // Add milestone
    await page.click('button:has-text("Add Milestone")')

    await page.fill('input[name="title"]', 'Phase 1 Complete')
    await page.fill('textarea[name="description"]', 'Complete initial development phase')

    const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await page.fill('input[name="targetDate"]', targetDate)

    await page.click('button[type="submit"]:has-text("Add Milestone")')

    // Should see milestone
    await expect(page.locator('text=Phase 1 Complete')).toBeVisible()

    // Mark milestone as completed
    await page.click('[data-testid="milestone-complete"]')
    await expect(page.locator('[data-testid="milestone-status"]:has-text("Completed")')).toBeVisible()
  })

  test('filter and search projects', async ({ page }) => {
    await page.goto('/project-manager/projects')

    // Use search
    await page.fill('input[placeholder*="Search"]', 'Test')
    await page.waitForTimeout(500) // Debounce

    // Filter by status
    await page.click('[data-testid="status-filter"]')
    await page.click('text=In Progress')

    // Filter by priority
    await page.click('[data-testid="priority-filter"]')
    await page.click('text=High')

    // Should show filtered results
    const projectCards = page.locator('[data-testid="project-card"]')
    await expect(projectCards).not.toHaveCount(0)
  })

  test('view project timeline and Gantt chart', async ({ page }) => {
    await page.goto('/project-manager/projects')

    // Open project
    await page.click('[data-testid="project-card"]:first-child')

    // Navigate to timeline
    await page.click('button:has-text("Timeline")')

    // Should show Gantt chart
    await expect(page.locator('[data-testid="gantt-chart"]')).toBeVisible()

    // Should show project phases
    await expect(page.locator('[data-testid="timeline-phase"]')).not.toHaveCount(0)
  })

  test('manage project risks', async ({ page }) => {
    await page.goto('/project-manager/projects')
    await page.click('[data-testid="project-card"]:first-child')

    // Navigate to risks tab
    await page.click('button:has-text("Risks")')

    // Add new risk
    await page.click('button:has-text("Add Risk")')

    await page.fill('input[name="title"]', 'Resource Availability Risk')
    await page.fill('textarea[name="description"]', 'Key developer may not be available')

    // Set severity
    await page.click('[data-testid="severity-select"]')
    await page.click('text=High')

    // Set probability
    await page.click('[data-testid="probability-select"]')
    await page.click('text=Medium')

    // Mitigation strategy
    await page.fill('textarea[name="mitigation"]', 'Cross-train team members')

    await page.click('button[type="submit"]:has-text("Add Risk")')

    // Should see risk in list
    await expect(page.locator('text=Resource Availability Risk')).toBeVisible()
  })

  test('delete project with confirmation', async ({ page }) => {
    // First create a project to delete
    await page.goto('/project-manager/projects')
    await page.click('button:has-text("New Project")')

    await page.fill('input[name="name"]', 'Project To Delete')
    await page.fill('textarea[name="description"]', 'This will be deleted')

    await page.click('[data-testid="client-select"]')
    await page.click('[role="option"]:first-child')

    await page.fill('input[name="budget"]', '10000')
    await page.click('button[type="submit"]:has-text("Create Project")')

    await expect(page.locator('text=project created')).toBeVisible()

    // Now delete it
    const projectCard = page.locator('text=Project To Delete').locator('..')
    await projectCard.hover()
    await projectCard.locator('[data-testid="delete-project"]').click()

    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")')

    // Should show success
    await expect(page.locator('text=project deleted')).toBeVisible()

    // Should not see project anymore
    await expect(page.locator('text=Project To Delete')).not.toBeVisible()
  })
})

test.describe('Project Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page)
  })

  test('view project statistics and metrics', async ({ page }) => {
    await page.goto('/project-manager/dashboard')

    // Should see key metrics
    await expect(page.locator('[data-testid="total-projects"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-projects"]')).toBeVisible()
    await expect(page.locator('[data-testid="completed-projects"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible()

    // Should see charts
    await expect(page.locator('[data-testid="project-status-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
  })

  test('view recent activities', async ({ page }) => {
    await page.goto('/project-manager/dashboard')

    // Should show activity feed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
    await expect(page.locator('[data-testid="activity-item"]')).not.toHaveCount(0)
  })

  test('quick actions from dashboard', async ({ page }) => {
    await page.goto('/project-manager/dashboard')

    // Click quick action to create project
    await page.click('[data-testid="quick-action-new-project"]')

    // Should open create project dialog
    await expect(page.locator('text=Create New Project')).toBeVisible()
  })
})
