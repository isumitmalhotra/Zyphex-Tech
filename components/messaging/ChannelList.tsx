/**
 * ChannelList Component
 * Displays channels and direct messages with unread badges
 */

"use client"

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Hash,
  MessageCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Briefcase,
  User as UserIcon,
  Lock
} from 'lucide-react'
import { Channel, GroupedUsers, ViewMode } from './types'
import { cn } from '@/lib/utils'
import { generateAvatar } from '@/lib/utils/avatar'
import { formatDistanceToNow } from 'date-fns'

interface ChannelListProps {
  channels: Channel[]
  users: GroupedUsers
  selectedChannelId: string | null
  viewMode: ViewMode
  searchQuery: string
  onChannelSelect: (channel: Channel) => void
  onUserSelect: (userId: string, userName: string) => void
  onViewModeChange: (mode: ViewMode) => void
  onSearchChange: (query: string) => void
}

export function ChannelList({
  channels,
  users,
  selectedChannelId,
  viewMode,
  searchQuery,
  onChannelSelect,
  onUserSelect,
  onViewModeChange,
  onSearchChange
}: ChannelListProps) {
  const [expandedSections, setExpandedSections] = useState({
    direct: true,
    projects: true,
    teams: true,
    general: true,
    admins: true,
    pms: true,
    teamMembers: true,
    clients: true
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Group channels by type
  const directChannels = channels.filter(c => c.type === 'DIRECT')
  const projectChannels = channels.filter(c => c.type === 'PROJECT')
  const teamChannels = channels.filter(c => c.type === 'TEAM')
  const generalChannels = channels.filter(c => c.type === 'GENERAL' || c.type === 'ADMIN')

  // Filter based on search
  const filterItems = (items: any[], searchField: string) => {
    if (!searchQuery.trim()) return items
    return items.filter(item =>
      item[searchField]?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const renderChannelIcon = (channel: Channel) => {
    if (channel.type === 'DIRECT') {
      const otherUser = channel.members[0]
      return (
        <Avatar className="h-6 w-6">
          <AvatarImage src={otherUser?.image || generateAvatar(otherUser?.name || otherUser?.email)} />
          <AvatarFallback>{otherUser?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      )
    }
    if (channel.isPrivate) return <Lock className="h-4 w-4" />
    return <Hash className="h-4 w-4" />
  }

  const renderUserIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'PROJECT_MANAGER':
        return <Briefcase className="h-4 w-4 text-blue-500" />
      case 'TEAM_MEMBER':
        return <Users className="h-4 w-4 text-green-500" />
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* Search Bar */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages, channels, users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex border-b">
        <Button
          variant={viewMode === 'channels' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => onViewModeChange('channels')}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Channels
        </Button>
        <Button
          variant={viewMode === 'users' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => onViewModeChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          People
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {viewMode === 'channels' ? (
          <div className="p-2">
            {/* Direct Messages */}
            {directChannels.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('direct')}
                >
                  {expandedSections.direct ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Direct Messages
                  <Badge variant="secondary" className="ml-auto">
                    {directChannels.length}
                  </Badge>
                </Button>
                {expandedSections.direct && (
                  <div className="space-y-1">
                    {filterItems(directChannels, 'name').map(channel => (
                      <Button
                        key={channel.id}
                        variant={selectedChannelId === channel.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onChannelSelect(channel)}
                      >
                        {renderChannelIcon(channel)}
                        <span className="ml-2 flex-1 truncate text-left">
                          {channel.name}
                        </span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Channels */}
            {projectChannels.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('projects')}
                >
                  {expandedSections.projects ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Briefcase className="mr-2 h-4 w-4" />
                  Projects
                  <Badge variant="secondary" className="ml-auto">
                    {projectChannels.length}
                  </Badge>
                </Button>
                {expandedSections.projects && (
                  <div className="space-y-1">
                    {filterItems(projectChannels, 'name').map(channel => (
                      <Button
                        key={channel.id}
                        variant={selectedChannelId === channel.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onChannelSelect(channel)}
                      >
                        {renderChannelIcon(channel)}
                        <span className="ml-2 flex-1 truncate text-left">
                          {channel.name}
                        </span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team Channels */}
            {teamChannels.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('teams')}
                >
                  {expandedSections.teams ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Users className="mr-2 h-4 w-4" />
                  Teams
                  <Badge variant="secondary" className="ml-auto">
                    {teamChannels.length}
                  </Badge>
                </Button>
                {expandedSections.teams && (
                  <div className="space-y-1">
                    {filterItems(teamChannels, 'name').map(channel => (
                      <Button
                        key={channel.id}
                        variant={selectedChannelId === channel.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onChannelSelect(channel)}
                      >
                        {renderChannelIcon(channel)}
                        <span className="ml-2 flex-1 truncate text-left">
                          {channel.name}
                        </span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* General Channels */}
            {generalChannels.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('general')}
                >
                  {expandedSections.general ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Hash className="mr-2 h-4 w-4" />
                  General
                  <Badge variant="secondary" className="ml-auto">
                    {generalChannels.length}
                  </Badge>
                </Button>
                {expandedSections.general && (
                  <div className="space-y-1">
                    {filterItems(generalChannels, 'name').map(channel => (
                      <Button
                        key={channel.id}
                        variant={selectedChannelId === channel.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onChannelSelect(channel)}
                      >
                        {renderChannelIcon(channel)}
                        <span className="ml-2 flex-1 truncate text-left">
                          {channel.name}
                        </span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Admins */}
            {users.admins.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('admins')}
                >
                  {expandedSections.admins ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Shield className="mr-2 h-4 w-4 text-red-500" />
                  Admins
                  <Badge variant="secondary" className="ml-auto">
                    {users.admins.length}
                  </Badge>
                </Button>
                {expandedSections.admins && (
                  <div className="space-y-1">
                    {filterItems(users.admins, 'name').map(user => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onUserSelect(user.id, user.name || user.email)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || generateAvatar(user.name || user.email)} />
                          <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                        <span className="ml-2 flex-1 truncate text-left">
                          {user.name || user.email}
                        </span>
                        {user.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {user.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Managers */}
            {users.projectManagers.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('pms')}
                >
                  {expandedSections.pms ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Briefcase className="mr-2 h-4 w-4 text-blue-500" />
                  Project Managers
                  <Badge variant="secondary" className="ml-auto">
                    {users.projectManagers.length}
                  </Badge>
                </Button>
                {expandedSections.pms && (
                  <div className="space-y-1">
                    {filterItems(users.projectManagers, 'name').map(user => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onUserSelect(user.id, user.name || user.email)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || generateAvatar(user.name || user.email)} />
                          <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                        <span className="ml-2 flex-1 truncate text-left">
                          {user.name || user.email}
                        </span>
                        {user.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {user.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team Members */}
            {users.teamMembers.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('teamMembers')}
                >
                  {expandedSections.teamMembers ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Users className="mr-2 h-4 w-4 text-green-500" />
                  Team Members
                  <Badge variant="secondary" className="ml-auto">
                    {users.teamMembers.length}
                  </Badge>
                </Button>
                {expandedSections.teamMembers && (
                  <div className="space-y-1">
                    {filterItems(users.teamMembers, 'name').map(user => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onUserSelect(user.id, user.name || user.email)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || generateAvatar(user.name || user.email)} />
                          <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                        <span className="ml-2 flex-1 truncate text-left">
                          {user.name || user.email}
                        </span>
                        {user.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {user.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clients */}
            {users.clients.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('clients')}
                >
                  {expandedSections.clients ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                  Clients
                  <Badge variant="secondary" className="ml-auto">
                    {users.clients.length}
                  </Badge>
                </Button>
                {expandedSections.clients && (
                  <div className="space-y-1">
                    {filterItems(users.clients, 'name').map(user => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3"
                        onClick={() => onUserSelect(user.id, user.name || user.email)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || generateAvatar(user.name || user.email)} />
                          <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                        <span className="ml-2 flex-1 truncate text-left">
                          {user.name || user.email}
                        </span>
                        {user.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                            {user.unreadCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
