/**
 * Enhanced ChannelList Component
 * Properly separates Channels from Direct Messages
 * Includes channel creation, deletion, and pinning features
 */

"use client"

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Lock,
  Plus,
  MoreVertical,
  Pin,
  Trash2,
  Edit,
  PinOff
} from 'lucide-react'
import { Channel, GroupedUsers, ViewMode } from './types'
import { cn } from '@/lib/utils'
import { generateAvatar } from '@/lib/utils/avatar'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

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
  onChannelCreate?: (data: { name: string; type: string; description?: string; isPrivate: boolean }) => Promise<void>
  onChannelDelete?: (channelId: string) => Promise<void>
  onChannelPin?: (channelId: string) => Promise<void>
  onAddMembers?: (channelId: string, memberIds: string[]) => Promise<void>
  onRemoveMembers?: (channelId: string, memberIds: string[]) => Promise<void>
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
  onSearchChange,
  onChannelCreate,
  onChannelDelete,
  onChannelPin,
  onAddMembers,
  onRemoveMembers
}: ChannelListProps) {
  const { data: session } = useSession()
  const [expandedSections, setExpandedSections] = useState({
    pinned: true,
    channels: true,
    directMessages: true,
    admins: true,
    projectManagers: true,
    teamMembers: true,
    clients: true
  })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [manageMembersOpen, setManageMembersOpen] = useState(false)
  const [selectedManageChannel, setSelectedManageChannel] = useState<Channel | null>(null)
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    type: 'GENERAL',
    description: '',
    isPrivate: false
  })
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  // Handle opening member management dialog
  const handleManageMembers = (channel: Channel) => {
    setSelectedManageChannel(channel)
    setSelectedMemberIds(channel.members?.map(m => m.id) || [])
    setManageMembersOpen(true)
  }

  // Separate channels from direct messages
  const actualChannels = channels.filter(c => c.type !== 'DIRECT')
  const directMessages = channels.filter(c => c.type === 'DIRECT')
  
  // Separate pinned channels
  const pinnedChannels = actualChannels.filter(c => c.isPinned)
  const unpinnedChannels = actualChannels.filter(c => !c.isPinned)

  // Filter based on search
  const filterItems = (items: any[], searchField: string) => {
    if (!searchQuery.trim()) return items
    return items.filter(item =>
      item[searchField]?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleCreateChannel = async () => {
    if (!newChannelData.name.trim()) {
      toast.error('Channel name is required')
      return
    }

    try {
      if (onChannelCreate) {
        await onChannelCreate(newChannelData)
        setCreateDialogOpen(false)
        setNewChannelData({ name: '', type: 'GENERAL', description: '', isPrivate: false })
        toast.success('Channel created successfully')
      }
    } catch (error) {
      toast.error('Failed to create channel')
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return
    
    try {
      if (onChannelDelete) {
        await onChannelDelete(channelId)
        toast.success('Channel deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete channel')
    }
  }

  const handlePinChannel = async (channelId: string) => {
    try {
      if (onChannelPin) {
        await onChannelPin(channelId)
        toast.success('Channel pinned/unpinned')
      }
    } catch (error) {
      toast.error('Failed to pin channel')
    }
  }

  const handleSaveMembers = async () => {
    if (!selectedManageChannel || !onAddMembers || !onRemoveMembers) return
    
    const currentMemberIds = selectedManageChannel.members?.map(m => m.id) || []
    const toAdd = selectedMemberIds.filter(id => !currentMemberIds.includes(id))
    const toRemove = currentMemberIds.filter(id => !selectedMemberIds.includes(id))
    
    try {
      if (toAdd.length > 0) {
        await onAddMembers(selectedManageChannel.id, toAdd)
      }
      if (toRemove.length > 0) {
        await onRemoveMembers(selectedManageChannel.id, toRemove)
      }
      setManageMembersOpen(false)
      setSelectedManageChannel(null)
      toast.success('Members updated successfully')
    } catch (error) {
      toast.error('Failed to update members')
    }
  }

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Get all users for member selection
  const getAllUsers = () => {
    return [
      ...users.admins,
      ...users.projectManagers,
      ...users.teamMembers,
      ...users.clients
    ]
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

  const renderChannelItem = (channel: Channel) => (
    <div key={channel.id} className="group relative flex items-center">
      <Button
        variant={selectedChannelId === channel.id ? 'secondary' : 'ghost'}
        size="sm"
        className="w-full justify-start px-3 pr-10"
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

      {channel.type !== 'DIRECT' && (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePinChannel(channel.id)}>
              {channel.isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin Channel
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin Channel
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleManageMembers(channel)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Channel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteChannel(channel.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Channel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* Search Bar */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
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
          <Hash className="mr-2 h-4 w-4" />
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {viewMode === 'channels' ? (
          <div className="space-y-4">
            {/* Pinned Channels */}
            {pinnedChannels.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('pinned')}
                >
                  {expandedSections.pinned ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Pin className="mr-2 h-4 w-4" />
                  Pinned
                  <Badge variant="secondary" className="ml-auto">
                    {pinnedChannels.length}
                  </Badge>
                </Button>
                {expandedSections.pinned && (
                  <div className="space-y-1">
                    {filterItems(pinnedChannels, 'name').map(renderChannelItem)}
                  </div>
                )}
              </div>
            )}

            {/* Channels Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start px-2"
                  onClick={() => toggleSection('channels')}
                >
                  {expandedSections.channels ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  <Hash className="mr-2 h-4 w-4" />
                  Channels
                  <Badge variant="secondary" className="ml-auto">
                    {unpinnedChannels.length}
                  </Badge>
                </Button>
                
                {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN') && (
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Channel</DialogTitle>
                        <DialogDescription>
                          Create a new channel for team collaboration
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Channel Name</label>
                          <Input
                            placeholder="e.g., general, project-updates"
                            value={newChannelData.name}
                            onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Channel Type</label>
                          <Select
                            value={newChannelData.type}
                            onValueChange={(value) => setNewChannelData(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GENERAL">General</SelectItem>
                              <SelectItem value="TEAM">Team</SelectItem>
                              <SelectItem value="PROJECT">Project</SelectItem>
                              <SelectItem value="ADMIN">Admin Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description (Optional)</label>
                          <Input
                            placeholder="What's this channel about?"
                            value={newChannelData.description}
                            onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="private"
                            checked={newChannelData.isPrivate}
                            onChange={(e) => setNewChannelData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                            className="h-4 w-4"
                          />
                          <label htmlFor="private" className="text-sm font-medium cursor-pointer">
                            Make this channel private
                          </label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateChannel}>
                          Create Channel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {expandedSections.channels && (
                <div className="space-y-1">
                  {filterItems(unpinnedChannels, 'name').map(renderChannelItem)}
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-1 w-full justify-start px-2"
                onClick={() => toggleSection('directMessages')}
              >
                {expandedSections.directMessages ? (
                  <ChevronDown className="mr-1 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-1 h-4 w-4" />
                )}
                <MessageCircle className="mr-2 h-4 w-4" />
                Direct Messages
                <Badge variant="secondary" className="ml-auto">
                  {directMessages.length}
                </Badge>
              </Button>
              {expandedSections.directMessages && (
                <div className="space-y-1">
                  {filterItems(directMessages, 'name').map(renderChannelItem)}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* People View */
          <div className="space-y-4">
            {/* Admins */}
            {users.admins.length > 0 && (
              <div>
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
                        <Badge variant="destructive" className="ml-2 h-5 text-xs">
                          Admin
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Managers */}
            {users.projectManagers.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 w-full justify-start px-2"
                  onClick={() => toggleSection('projectManagers')}
                >
                  {expandedSections.projectManagers ? (
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
                {expandedSections.projectManagers && (
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
                        <Badge variant="default" className="ml-2 h-5 text-xs">
                          PM
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team Members */}
            {users.teamMembers.length > 0 && (
              <div>
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
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clients */}
            {users.clients.length > 0 && (
              <div>
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
                        <Badge variant="outline" className="ml-2 h-5 text-xs">
                          Client
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Management Dialog */}
      <Dialog open={manageMembersOpen} onOpenChange={setManageMembersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Channel Members</DialogTitle>
            <DialogDescription>
              Add or remove members from {selectedManageChannel?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] space-y-2 overflow-y-auto py-4">
            {getAllUsers().map((user) => (
              <div key={user.id} className="flex items-center space-x-3 rounded-lg p-2 hover:bg-muted">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedMemberIds.includes(user.id)}
                  onCheckedChange={() => toggleMemberSelection(user.id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || generateAvatar(user.name || user.email)} />
                  <AvatarFallback>{user.name?.[0] || user.email?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-medium">{user.name || user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageMembersOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMembers}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
