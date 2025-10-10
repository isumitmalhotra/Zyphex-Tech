/**
 * Role-Based Access Control for Messaging System
 * 
 * This module provides functions to determine channel and user visibility
 * based on the current user's role and project assignments.
 */

import { User, Channel, Role, ChannelType } from "@prisma/client"

/**
 * Extended User type with project relationships
 */
export interface UserWithProjects extends User {
  projects?: { id: string }[]
  managedProjects?: { id: string }[]
}

/**
 * Extended Channel type with members and project
 */
export interface ChannelWithMembers extends Channel {
  members?: Array<{
    id: string
    name: string | null
    email: string
    image: string | null
    role: Role
  }>
  project?: { id: string; name: string } | null
  messages?: Array<any>
  createdBy?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/**
 * Get all users that the current user is allowed to see and message
 * 
 * @param currentUser - The currently authenticated user
 * @param allUsers - All users in the system
 * @returns Filtered list of users based on role permissions
 */
export function getVisibleUsers(
  currentUser: UserWithProjects,
  allUsers: UserWithProjects[]
): UserWithProjects[] {
  const currentUserProjectIds = [
    ...(currentUser.projects?.map(p => p.id) || []),
    ...(currentUser.managedProjects?.map(p => p.id) || [])
  ]

  switch (currentUser.role) {
    case "CLIENT":
    case "USER":
      // Clients can see:
      // 1. All SUPER_ADMIN and ADMIN users (for support)
      // 2. PROJECT_MANAGER users on their projects
      // 3. TEAM_MEMBER users assigned to their projects
      return allUsers.filter(user => {
        if (user.id === currentUser.id) return false
        
        // Can always see admins for support
        if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
          return true
        }

        // Can see team members and PMs on shared projects
        const userProjectIds = [
          ...(user.projects?.map(p => p.id) || []),
          ...(user.managedProjects?.map(p => p.id) || [])
        ]

        const hasSharedProject = userProjectIds.some(pid => 
          currentUserProjectIds.includes(pid)
        )

        return hasSharedProject && (
          user.role === "PROJECT_MANAGER" || 
          user.role === "TEAM_MEMBER"
        )
      })

    case "TEAM_MEMBER":
      // Team members can see:
      // 1. All internal team members (TEAM_MEMBER, PROJECT_MANAGER, ADMIN, SUPER_ADMIN)
      // 2. Only CLIENT/USER users on projects they're assigned to
      return allUsers.filter(user => {
        if (user.id === currentUser.id) return false

        // Can see all internal team members
        if (
          user.role === "TEAM_MEMBER" ||
          user.role === "PROJECT_MANAGER" ||
          user.role === "ADMIN" ||
          user.role === "SUPER_ADMIN"
        ) {
          return true
        }

        // For clients, check if on same project
        if (user.role === "CLIENT" || user.role === "USER") {
          const userProjectIds = [
            ...(user.projects?.map(p => p.id) || []),
            ...(user.managedProjects?.map(p => p.id) || [])
          ]

          return userProjectIds.some(pid => 
            currentUserProjectIds.includes(pid)
          )
        }

        return false
      })

    case "PROJECT_MANAGER":
      // Project managers can see:
      // 1. All team members and other PMs
      // 2. All clients in the system (when projects are created)
      // 3. All admins
      return allUsers.filter(user => user.id !== currentUser.id)

    case "ADMIN":
    case "SUPER_ADMIN":
      // Admins can see everyone except themselves
      return allUsers.filter(user => user.id !== currentUser.id)

    default:
      return []
  }
}

/**
 * Get all channels that the current user is allowed to see
 * 
 * @param currentUser - The currently authenticated user
 * @param allChannels - All channels in the system
 * @returns Filtered list of channels based on role permissions
 */
export function getVisibleChannels(
  currentUser: UserWithProjects,
  allChannels: ChannelWithMembers[]
): ChannelWithMembers[] {
  const currentUserProjectIds = [
    ...(currentUser.projects?.map(p => p.id) || []),
    ...(currentUser.managedProjects?.map(p => p.id) || [])
  ]

  switch (currentUser.role) {
    case "CLIENT":
    case "USER":
      // Clients can see:
      // 1. GENERAL channels (company-wide)
      // 2. CLIENT channels (client-specific)
      // 3. PROJECT channels for their projects
      // 4. DIRECT channels they're a member of
      return allChannels.filter(channel => {
        if (channel.type === "GENERAL") return true
        if (channel.type === "CLIENT") return true

        if (channel.type === "PROJECT") {
          return channel.projectId && currentUserProjectIds.includes(channel.projectId)
        }

        if (channel.type === "DIRECT") {
          return channel.members?.some(m => m.id === currentUser.id)
        }

        return false
      })

    case "TEAM_MEMBER":
      // Team members can see:
      // 1. GENERAL channels
      // 2. TEAM channels
      // 3. PROJECT channels for projects they're assigned to
      // 4. DIRECT channels they're a member of
      // 5. ADMIN channels they're explicitly added to
      return allChannels.filter(channel => {
        if (channel.type === "GENERAL") return true
        if (channel.type === "TEAM") return true

        if (channel.type === "PROJECT") {
          return channel.projectId && currentUserProjectIds.includes(channel.projectId)
        }

        if (channel.type === "DIRECT") {
          return channel.members?.some(m => m.id === currentUser.id)
        }

        if (channel.type === "ADMIN") {
          return channel.members?.some(m => m.id === currentUser.id)
        }

        return false
      })

    case "PROJECT_MANAGER":
      // Project managers can see:
      // 1. All channels except private channels they're not a member of
      return allChannels.filter(channel => {
        if (!channel.isPrivate) return true
        return channel.members?.some(m => m.id === currentUser.id)
      })

    case "ADMIN":
    case "SUPER_ADMIN":
      // Admins can see all channels
      return allChannels

    default:
      return []
  }
}

/**
 * Check if a user can access a specific channel
 * 
 * @param user - The user to check
 * @param channel - The channel to check access for
 * @returns true if user has access, false otherwise
 */
export function canAccessChannel(
  user: UserWithProjects,
  channel: ChannelWithMembers
): boolean {
  // Admins can access everything
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return true
  }

  // Check if user is a member of the channel
  if (channel.members?.some(m => m.id === user.id)) {
    return true
  }

  // Public channels are accessible based on type
  if (!channel.isPrivate) {
    switch (channel.type) {
      case "GENERAL":
        return true
      
      case "TEAM":
        return user.role === "TEAM_MEMBER" || 
               user.role === "PROJECT_MANAGER"
      
      case "CLIENT":
        return user.role === "CLIENT" || 
               user.role === "USER" ||
               user.role === "PROJECT_MANAGER"
      
      case "PROJECT":
        if (!channel.projectId) return false
        const userProjectIds = [
          ...(user.projects?.map(p => p.id) || []),
          ...(user.managedProjects?.map(p => p.id) || [])
        ]
        return userProjectIds.includes(channel.projectId)
      
      default:
        return false
    }
  }

  return false
}

/**
 * Check if a user can message another user
 * 
 * @param sender - The user sending the message
 * @param recipient - The intended recipient
 * @returns true if sender can message recipient, false otherwise
 */
export function canMessageUser(
  sender: UserWithProjects,
  recipient: UserWithProjects
): boolean {
  // Can't message yourself
  if (sender.id === recipient.id) return false

  // Admins can message anyone
  if (sender.role === "ADMIN" || sender.role === "SUPER_ADMIN") {
    return true
  }

  const senderProjectIds = [
    ...(sender.projects?.map(p => p.id) || []),
    ...(sender.managedProjects?.map(p => p.id) || [])
  ]

  const recipientProjectIds = [
    ...(recipient.projects?.map(p => p.id) || []),
    ...(recipient.managedProjects?.map(p => p.id) || [])
  ]

  switch (sender.role) {
    case "CLIENT":
    case "USER":
      // Clients can message:
      // 1. Admins
      // 2. Team members and PMs on their projects
      if (recipient.role === "ADMIN" || recipient.role === "SUPER_ADMIN") {
        return true
      }

      const hasSharedProject = recipientProjectIds.some(pid => 
        senderProjectIds.includes(pid)
      )

      return hasSharedProject && (
        recipient.role === "PROJECT_MANAGER" || 
        recipient.role === "TEAM_MEMBER"
      )

    case "TEAM_MEMBER":
      // Team members can message:
      // 1. All internal team members
      // 2. Clients on projects they're assigned to
      if (
        recipient.role === "TEAM_MEMBER" ||
        recipient.role === "PROJECT_MANAGER" ||
        recipient.role === "ADMIN" ||
        recipient.role === "SUPER_ADMIN"
      ) {
        return true
      }

      if (recipient.role === "CLIENT" || recipient.role === "USER") {
        return recipientProjectIds.some(pid => 
          senderProjectIds.includes(pid)
        )
      }

      return false

    case "PROJECT_MANAGER":
      // Project managers can message anyone
      return true

    default:
      return false
  }
}

/**
 * Get grouped users for display in the messaging UI
 * 
 * @param currentUser - The currently authenticated user
 * @param allUsers - All users in the system
 * @returns Users grouped by category
 */
export function getGroupedUsers(
  currentUser: UserWithProjects,
  allUsers: UserWithProjects[]
) {
  const visibleUsers = getVisibleUsers(currentUser, allUsers)

  const groups = {
    admins: [] as UserWithProjects[],
    teamMembers: [] as UserWithProjects[],
    projectManagers: [] as UserWithProjects[],
    clients: [] as UserWithProjects[]
  }

  visibleUsers.forEach(user => {
    switch (user.role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        groups.admins.push(user)
        break
      case "PROJECT_MANAGER":
        groups.projectManagers.push(user)
        break
      case "TEAM_MEMBER":
        groups.teamMembers.push(user)
        break
      case "CLIENT":
      case "USER":
        groups.clients.push(user)
        break
    }
  })

  return groups
}

/**
 * Get grouped channels for display in the messaging UI
 * 
 * @param currentUser - The currently authenticated user
 * @param allChannels - All channels in the system
 * @returns Channels grouped by type
 */
export function getGroupedChannels(
  currentUser: UserWithProjects,
  allChannels: ChannelWithMembers[]
) {
  const visibleChannels = getVisibleChannels(currentUser, allChannels)

  const groups = {
    direct: [] as ChannelWithMembers[],
    projects: [] as ChannelWithMembers[],
    teams: [] as ChannelWithMembers[],
    general: [] as ChannelWithMembers[],
    announcements: [] as ChannelWithMembers[]
  }

  visibleChannels.forEach(channel => {
    switch (channel.type) {
      case "DIRECT":
        groups.direct.push(channel)
        break
      case "PROJECT":
        groups.projects.push(channel)
        break
      case "TEAM":
        groups.teams.push(channel)
        break
      case "GENERAL":
        groups.general.push(channel)
        break
      case "ADMIN":
        groups.announcements.push(channel)
        break
    }
  })

  return groups
}
