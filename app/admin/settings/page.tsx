"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, User, Bell, Shield, Palette, Database, Save } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />

      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 relative z-10">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 zyphex-button-secondary hover-zyphex-glow" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin" className="zyphex-subheading hover:text-white">
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold zyphex-heading">Settings</h1>
          <p className="zyphex-subheading">Manage your application settings and preferences.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 zyphex-glass-effect">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <CardTitle className="zyphex-heading">General Settings</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Configure basic application settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="zyphex-heading">
                      Company Name
                    </Label>
                    <Input
                      id="company-name"
                      defaultValue="Zyphex Tech"
                      className="zyphex-glass-effect border-gray-600 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="zyphex-heading">
                      Website
                    </Label>
                    <Input
                      id="website"
                      defaultValue="https://zyphextech.com"
                      className="zyphex-glass-effect border-gray-600 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="zyphex-heading">
                    Company Description
                  </Label>
                  <Textarea
                    id="description"
                    defaultValue="Leading remote IT services agency delivering innovative technology solutions."
                    className="zyphex-glass-effect border-gray-600 focus:border-blue-400"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="zyphex-heading">
                      Timezone
                    </Label>
                    <Select defaultValue="utc-5">
                      <SelectTrigger className="zyphex-glass-effect border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="zyphex-glass-effect border-gray-800/50">
                        <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                        <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                        <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="zyphex-heading">
                      Default Currency
                    </Label>
                    <Select defaultValue="usd">
                      <SelectTrigger className="zyphex-glass-effect border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="zyphex-glass-effect border-gray-800/50">
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="cad">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="zyphex-button-primary hover-zyphex-lift">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <CardTitle className="zyphex-heading">Notification Preferences</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Configure how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">Email Notifications</Label>
                      <p className="text-sm zyphex-subheading">Receive notifications via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">Project Updates</Label>
                      <p className="text-sm zyphex-subheading">Get notified about project status changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">New Client Inquiries</Label>
                      <p className="text-sm zyphex-subheading">Receive alerts for new client messages</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">Payment Notifications</Label>
                      <p className="text-sm zyphex-subheading">Get notified about payment updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">System Alerts</Label>
                      <p className="text-sm zyphex-subheading">Receive system maintenance and security alerts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button className="zyphex-button-primary hover-zyphex-lift">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <CardTitle className="zyphex-heading">Security Settings</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Manage your account security and authentication preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">Two-Factor Authentication</Label>
                      <p className="text-sm zyphex-subheading">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">Login Notifications</Label>
                      <p className="text-sm zyphex-subheading">Get notified of new login attempts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="zyphex-heading">Session Timeout</Label>
                      <p className="text-sm zyphex-subheading">Automatically log out after inactivity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="zyphex-heading">
                      Current Password
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="zyphex-glass-effect border-gray-600 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="zyphex-heading">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="zyphex-glass-effect border-gray-600 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="zyphex-heading">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="zyphex-glass-effect border-gray-600 focus:border-blue-400"
                    />
                  </div>
                </div>
                <Button className="zyphex-button-primary hover-zyphex-lift">
                  <Save className="mr-2 h-4 w-4" />
                  Update Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
