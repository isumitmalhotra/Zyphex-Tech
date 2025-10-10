/**
 * Messaging System - TypeScript Interfaces
 * Shared types for the messaging system
 */

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

export interface Message {
  id: string
  content: string
  sender: User
  receiver?: User | null
  channelId: string | null
  parentId?: string | null
  parent?: {
    id: string
    content: string
    sender: User
  } | null
  replies?: Message[]
  replyCount?: number
  reactions?: Reaction[]
  messageType: string
  isRead: boolean
  createdAt: string
  updatedAt?: string
}

export interface Channel {
  id: string
  name: string
  description?: string | null
  type: 'TEAM' | 'PROJECT' | 'DIRECT' | 'GENERAL' | 'ADMIN' | 'CLIENT'
  isPrivate: boolean
  projectId?: string | null
  project?: {
    id: string
    name: string
  } | null
  members: User[]
  memberCount: number
  lastMessage?: {
    id: string
    content: string
    sender: User
    createdAt: string
  } | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface GroupedUsers {
  admins: UserWithUnread[]
  projectManagers: UserWithUnread[]
  teamMembers: UserWithUnread[]
  clients: UserWithUnread[]
}

export interface UserWithUnread extends User {
  projects?: Array<{ id: string; name: string }>
  managedProjects?: Array<{ id: string; name: string }>
  unreadCount: number
  dmChannelId: string | null
}

export interface Reaction {
  id: string
  emoji: string
  userId: string
  user: {
    id: string
    name: string | null
  }
}

export interface SearchResults {
  messages: Array<{
    id: string
    content: string
    sender: User
    channel: {
      id: string
      name: string
      type: string
    }
    createdAt: string
    type: 'message'
  }>
  channels: Array<{
    id: string
    name: string
    description?: string
    channelType: string
    isPrivate: boolean
    memberCount: number
    type: 'channel'
  }>
  users: Array<{
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    type: 'user'
  }>
}

export interface TypingUser {
  userId: string
  userName: string
  channelId: string
}

export type ViewMode = 'channels' | 'users' | 'search'
