"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Save,
  Camera,
  AlertTriangle,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useSession } from "next-auth/react"

function ProfileContent() {
  const { data: session } = useSession()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Profile Settings</h1>
            <p className="zyphex-subheading">Manage your personal information and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture & Basic Info */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative mx-auto w-32 h-32">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {session?.user?.name?.[0] || 'U'}
                </div>
                <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold zyphex-heading">{session?.user?.name || 'User Name'}</h3>
                <p className="text-sm zyphex-subheading">{session?.user?.email || 'user@example.com'}</p>
                <Badge variant="secondary" className="mt-2">Project Manager</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="lg:col-span-2 zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Mitchell" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={session?.user?.email || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue="Project Management" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue="New York, NY" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself..."
                  defaultValue="Experienced project manager with expertise in software development and team leadership."
                />
              </div>
              <Button className="zyphex-button">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="font-medium zyphex-heading">Email</p>
                  <p className="text-sm zyphex-subheading">{session?.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Phone className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium zyphex-heading">Phone</p>
                  <p className="text-sm zyphex-subheading">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <MapPin className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="font-medium zyphex-heading">Location</p>
                  <p className="text-sm zyphex-subheading">New York, NY</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" defaultValue="Senior Project Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input id="experience" defaultValue="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Input id="skills" defaultValue="Project Management, Agile, Scrum, Leadership" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input id="joinDate" type="date" defaultValue="2020-01-15" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_DASHBOARD}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view profile.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </PermissionGuard>
  )
}