"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Bell,
  FolderKanban,
  Plug,
  Users,
  Palette,
  Save,
  Upload,
  Key,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Webhook,
  Code,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useScrollAnimation } from "@/components/scroll-animations"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  useScrollAnimation()
  const { toast } = useToast()

  // State for all settings
  const [isSaving, setIsSaving] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Profile Settings
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@zyphex.com",
    phone: "+1 (555) 123-4567",
    bio: "Experienced project manager with 10+ years in software development",
    timezone: "America/New_York",
    language: "en"
  })

  // Password Change
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    email: {
      taskAssignments: true,
      projectUpdates: true,
      mentions: true,
      deadlines: true,
      teamMessages: false,
      weeklyDigest: true
    },
    inApp: {
      taskAssignments: true,
      projectUpdates: true,
      mentions: true,
      deadlines: true,
      teamMessages: true
    },
    frequency: "realtime", // realtime, hourly, daily
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  })

  // Project Defaults
  const [projectDefaults, setProjectDefaults] = useState({
    methodology: "AGILE",
    defaultView: "board",
    defaultStatus: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
    defaultPriority: "MEDIUM",
    autoAssignTasks: false,
    requireTimeEstimates: true,
    enableNotifications: true
  })

  // Integration Settings
  const [integrations, _setIntegrations] = useState({
    slack: { connected: false, webhook: "" },
    github: { connected: false, apiKey: "" },
    jira: { connected: false, apiKey: "" },
    email: { 
      connected: true, 
      provider: "gmail",
      smtp: "smtp.gmail.com",
      port: "587"
    }
  })

  // Team Preferences
  const [teamPreferences, setTeamPreferences] = useState({
    defaultRole: "MEMBER",
    canCreateProjects: false,
    canInviteMembers: true,
    canDeleteTasks: false,
    requireApproval: true,
    autoNotifyTeam: true
  })

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: "system", // light, dark, system
    colorScheme: "purple", // purple, blue, green, orange
    compactMode: false,
    dashboardLayout: "grid", // grid, list
    showAvatars: true,
    animationsEnabled: true
  })

  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully."
    })
    setIsSaving(false)
  }

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive"
      })
      return
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      })
      return
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully."
    })
    setPasswords({ current: "", new: "", confirm: "" })
    setIsSaving(false)
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved."
    })
    setIsSaving(false)
  }

  const handleSaveProjectDefaults = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Project Defaults Saved",
      description: "Your default project settings have been updated."
    })
    setIsSaving(false)
  }

  const handleSaveIntegrations = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Integrations Updated",
      description: "Your integration settings have been saved."
    })
    setIsSaving(false)
  }

  const handleSaveTeamPreferences = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Team Preferences Saved",
      description: "Your team preferences have been updated."
    })
    setIsSaving(false)
  }

  const handleSaveAppearance = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: "Appearance Updated",
      description: "Your appearance settings have been saved."
    })
    setIsSaving(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="scroll-reveal">
          <h1 className="text-3xl font-bold zyphex-heading">Settings</h1>
          <p className="zyphex-subheading">Manage your account settings and preferences</p>
        </div>

        {/* Tabbed Settings Interface */}
        <Tabs defaultValue="profile" className="scroll-reveal">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-2xl">JD</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="photo">Profile Photo</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </Button>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                    <p className="text-sm zyphex-subheading">JPG, GIF or PNG. Max size 2MB.</p>
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">
                      <Clock className="inline h-4 w-4 mr-2" />
                      Timezone
                    </Label>
                    <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="zyphex-button-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showOldPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm zyphex-subheading">Must be at least 8 characters long</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Preferences Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Email Notifications</CardTitle>
                <CardDescription>Choose what email notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Assignments</Label>
                    <p className="text-sm zyphex-subheading">Get notified when you&apos;re assigned to a task</p>
                  </div>
                  <Switch
                    checked={notifications.email.taskAssignments}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, taskAssignments: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Project Updates</Label>
                    <p className="text-sm zyphex-subheading">Updates about your projects</p>
                  </div>
                  <Switch
                    checked={notifications.email.projectUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, projectUpdates: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mentions</Label>
                    <p className="text-sm zyphex-subheading">When someone @mentions you in a comment</p>
                  </div>
                  <Switch
                    checked={notifications.email.mentions}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, mentions: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Deadline Reminders</Label>
                    <p className="text-sm zyphex-subheading">Reminders for upcoming deadlines</p>
                  </div>
                  <Switch
                    checked={notifications.email.deadlines}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, deadlines: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Team Messages</Label>
                    <p className="text-sm zyphex-subheading">Messages from team members</p>
                  </div>
                  <Switch
                    checked={notifications.email.teamMessages}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, teamMessages: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-sm zyphex-subheading">Weekly summary of your activity</p>
                  </div>
                  <Switch
                    checked={notifications.email.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, weeklyDigest: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">In-App Notifications</CardTitle>
                <CardDescription>Configure your in-app notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Task Assignments</Label>
                  <Switch
                    checked={notifications.inApp.taskAssignments}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, taskAssignments: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label>Project Updates</Label>
                  <Switch
                    checked={notifications.inApp.projectUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, projectUpdates: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label>Mentions</Label>
                  <Switch
                    checked={notifications.inApp.mentions}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, mentions: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label>Deadlines</Label>
                  <Switch
                    checked={notifications.inApp.deadlines}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, deadlines: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label>Team Messages</Label>
                  <Switch
                    checked={notifications.inApp.teamMessages}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, teamMessages: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Notification Frequency</CardTitle>
                <CardDescription>Choose how often you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Frequency</Label>
                  <Select value={notifications.frequency} onValueChange={(value) => setNotifications({ ...notifications, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time (Immediate)</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Quiet Hours</Label>
                      <p className="text-sm zyphex-subheading">Pause notifications during specified hours</p>
                    </div>
                    <Switch
                      checked={notifications.quietHours.enabled}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          quietHours: { ...notifications.quietHours, enabled: checked }
                        })
                      }
                    />
                  </div>

                  {notifications.quietHours.enabled && (
                    <div className="grid gap-4 md:grid-cols-2 ml-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={notifications.quietHours.start}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              quietHours: { ...notifications.quietHours, start: e.target.value }
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={notifications.quietHours.end}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              quietHours: { ...notifications.quietHours, end: e.target.value }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveNotifications} disabled={isSaving} className="zyphex-button-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Preferences
                  </Button>
                  <Button variant="outline">Reset to Defaults</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Defaults Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Default Project Settings</CardTitle>
                <CardDescription>Set default preferences for new projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Methodology</Label>
                    <Select value={projectDefaults.methodology} onValueChange={(value) => setProjectDefaults({ ...projectDefaults, methodology: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AGILE">Agile</SelectItem>
                        <SelectItem value="SCRUM">Scrum</SelectItem>
                        <SelectItem value="KANBAN">Kanban</SelectItem>
                        <SelectItem value="WATERFALL">Waterfall</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Project View</Label>
                    <Select value={projectDefaults.defaultView} onValueChange={(value) => setProjectDefaults({ ...projectDefaults, defaultView: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">List View</SelectItem>
                        <SelectItem value="board">Board View</SelectItem>
                        <SelectItem value="timeline">Timeline View</SelectItem>
                        <SelectItem value="calendar">Calendar View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Priority</Label>
                    <Select value={projectDefaults.defaultPriority} onValueChange={(value) => setProjectDefaults({ ...projectDefaults, defaultPriority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium zyphex-heading">Default Task Statuses</h4>
                  <div className="grid gap-2">
                    {projectDefaults.defaultStatus.map((status, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{status}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    Customize Statuses
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium zyphex-heading">Project Automation</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-assign Tasks</Label>
                      <p className="text-sm zyphex-subheading">Automatically assign tasks to team members</p>
                    </div>
                    <Switch
                      checked={projectDefaults.autoAssignTasks}
                      onCheckedChange={(checked) =>
                        setProjectDefaults({ ...projectDefaults, autoAssignTasks: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Time Estimates</Label>
                      <p className="text-sm zyphex-subheading">Make time estimates mandatory for tasks</p>
                    </div>
                    <Switch
                      checked={projectDefaults.requireTimeEstimates}
                      onCheckedChange={(checked) =>
                        setProjectDefaults({ ...projectDefaults, requireTimeEstimates: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm zyphex-subheading">Turn on notifications for new projects by default</p>
                    </div>
                    <Switch
                      checked={projectDefaults.enableNotifications}
                      onCheckedChange={(checked) =>
                        setProjectDefaults({ ...projectDefaults, enableNotifications: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProjectDefaults} disabled={isSaving} className="zyphex-button-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Defaults
                  </Button>
                  <Button variant="outline">Reset</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Settings Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Third-Party Integrations</CardTitle>
                <CardDescription>Connect and manage external tools and services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slack Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium zyphex-heading">Slack</h4>
                      <p className="text-sm zyphex-subheading">Team communication and notifications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.slack.connected ? (
                      <>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                        <Button variant="outline" size="sm">Configure</Button>
                        <Button variant="ghost" size="sm">Disconnect</Button>
                      </>
                    ) : (
                      <Button size="sm" className="zyphex-button-primary">Connect</Button>
                    )}
                  </div>
                </div>

                {/* GitHub Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Code className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium zyphex-heading">GitHub</h4>
                      <p className="text-sm zyphex-subheading">Link commits and pull requests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.github.connected ? (
                      <>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                        <Button variant="outline" size="sm">Configure</Button>
                        <Button variant="ghost" size="sm">Disconnect</Button>
                      </>
                    ) : (
                      <Button size="sm" className="zyphex-button-primary">Connect</Button>
                    )}
                  </div>
                </div>

                {/* Jira Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg">
                      <FolderKanban className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-medium zyphex-heading">Jira</h4>
                      <p className="text-sm zyphex-subheading">Sync tasks and issues</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.jira.connected ? (
                      <>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                        <Button variant="outline" size="sm">Configure</Button>
                        <Button variant="ghost" size="sm">Disconnect</Button>
                      </>
                    ) : (
                      <Button size="sm" className="zyphex-button-primary">Connect</Button>
                    )}
                  </div>
                </div>

                {/* Email Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Mail className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium zyphex-heading">Email</h4>
                      <p className="text-sm zyphex-subheading">Email integration and SMTP settings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>Configure webhooks for real-time event notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://your-domain.com/webhook" />
                  <p className="text-sm zyphex-subheading">Receive POST requests when events occur</p>
                </div>

                <div className="space-y-2">
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="task-created" defaultChecked />
                      <Label htmlFor="task-created" className="font-normal cursor-pointer">Task Created</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="task-completed" defaultChecked />
                      <Label htmlFor="task-completed" className="font-normal cursor-pointer">Task Completed</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="project-updated" />
                      <Label htmlFor="project-updated" className="font-normal cursor-pointer">Project Updated</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveIntegrations} disabled={isSaving} className="zyphex-button-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Webhook
                  </Button>
                  <Button variant="outline">Test Webhook</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage API keys for programmatic access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Personal API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value="••••••••••••••••••••••••••••••••" readOnly />
                    <Button variant="outline">Reveal</Button>
                    <Button variant="outline">Regenerate</Button>
                  </div>
                  <p className="text-sm zyphex-subheading">Use this key to access Zyphex API</p>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-500/5">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-sm">Keep your API key secure</h5>
                      <p className="text-sm zyphex-subheading mt-1">
                        Do not share your API key with others or expose it in client-side code.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Preferences Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Team Member Defaults</CardTitle>
                <CardDescription>Set default permissions and access levels for new team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Team Member Role</Label>
                  <Select value={teamPreferences.defaultRole} onValueChange={(value) => setTeamPreferences({ ...teamPreferences, defaultRole: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium zyphex-heading">Default Permissions</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Create Projects</Label>
                      <p className="text-sm zyphex-subheading">Allow members to create new projects</p>
                    </div>
                    <Switch
                      checked={teamPreferences.canCreateProjects}
                      onCheckedChange={(checked) =>
                        setTeamPreferences({ ...teamPreferences, canCreateProjects: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Invite Members</Label>
                      <p className="text-sm zyphex-subheading">Allow members to invite new team members</p>
                    </div>
                    <Switch
                      checked={teamPreferences.canInviteMembers}
                      onCheckedChange={(checked) =>
                        setTeamPreferences({ ...teamPreferences, canInviteMembers: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Delete Tasks</Label>
                      <p className="text-sm zyphex-subheading">Allow members to delete tasks</p>
                    </div>
                    <Switch
                      checked={teamPreferences.canDeleteTasks}
                      onCheckedChange={(checked) =>
                        setTeamPreferences({ ...teamPreferences, canDeleteTasks: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Approval</Label>
                      <p className="text-sm zyphex-subheading">Task completion requires manager approval</p>
                    </div>
                    <Switch
                      checked={teamPreferences.requireApproval}
                      onCheckedChange={(checked) =>
                        setTeamPreferences({ ...teamPreferences, requireApproval: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-notify Team</Label>
                      <p className="text-sm zyphex-subheading">Automatically notify team of important updates</p>
                    </div>
                    <Switch
                      checked={teamPreferences.autoNotifyTeam}
                      onCheckedChange={(checked) =>
                        setTeamPreferences({ ...teamPreferences, autoNotifyTeam: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveTeamPreferences} disabled={isSaving} className="zyphex-button-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Team Preferences
                  </Button>
                  <Button variant="outline">Reset</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Theme & Display</CardTitle>
                <CardDescription>Customize the look and feel of your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={appearance.theme} onValueChange={(value) => setAppearance({ ...appearance, theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System (Auto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-4 gap-4">
                    <button
                      onClick={() => setAppearance({ ...appearance, colorScheme: "purple" })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        appearance.colorScheme === "purple" ? "border-purple-500 bg-purple-500/10" : "border-transparent hover:border-purple-500/50"
                      }`}
                    >
                      <div className="w-full h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                      <p className="text-sm mt-2">Purple</p>
                    </button>
                    <button
                      onClick={() => setAppearance({ ...appearance, colorScheme: "blue" })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        appearance.colorScheme === "blue" ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:border-blue-500/50"
                      }`}
                    >
                      <div className="w-full h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded"></div>
                      <p className="text-sm mt-2">Blue</p>
                    </button>
                    <button
                      onClick={() => setAppearance({ ...appearance, colorScheme: "green" })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        appearance.colorScheme === "green" ? "border-green-500 bg-green-500/10" : "border-transparent hover:border-green-500/50"
                      }`}
                    >
                      <div className="w-full h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded"></div>
                      <p className="text-sm mt-2">Green</p>
                    </button>
                    <button
                      onClick={() => setAppearance({ ...appearance, colorScheme: "orange" })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        appearance.colorScheme === "orange" ? "border-orange-500 bg-orange-500/10" : "border-transparent hover:border-orange-500/50"
                      }`}
                    >
                      <div className="w-full h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded"></div>
                      <p className="text-sm mt-2">Orange</p>
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Dashboard Layout</Label>
                  <Select value={appearance.dashboardLayout} onValueChange={(value) => setAppearance({ ...appearance, dashboardLayout: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="list">List Layout</SelectItem>
                      <SelectItem value="compact">Compact Layout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium zyphex-heading">Display Options</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm zyphex-subheading">Reduce spacing for more content</p>
                    </div>
                    <Switch
                      checked={appearance.compactMode}
                      onCheckedChange={(checked) =>
                        setAppearance({ ...appearance, compactMode: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Avatars</Label>
                      <p className="text-sm zyphex-subheading">Display user avatars throughout the app</p>
                    </div>
                    <Switch
                      checked={appearance.showAvatars}
                      onCheckedChange={(checked) =>
                        setAppearance({ ...appearance, showAvatars: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Animations</Label>
                      <p className="text-sm zyphex-subheading">Enable smooth transitions and animations</p>
                    </div>
                    <Switch
                      checked={appearance.animationsEnabled}
                      onCheckedChange={(checked) =>
                        setAppearance({ ...appearance, animationsEnabled: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveAppearance} disabled={isSaving} className="zyphex-button-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Appearance
                  </Button>
                  <Button variant="outline">Reset to Defaults</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}