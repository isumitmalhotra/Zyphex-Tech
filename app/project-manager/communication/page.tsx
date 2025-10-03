"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  MessageSquare,
  Users,
  AlertTriangle,
  RefreshCw,
  Plus,
  Clock,
  Mail,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import Link from "next/link"

export default function TeamCommunication() {
  return (
    <PermissionGuard 
      permission={Permission.SEND_MESSAGES}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to access team communication.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Team Communication</h1>
              <p className="zyphex-subheading">Manage team communications and messages</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="zyphex-button">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" className="zyphex-button">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-heading">24</div>
                <p className="text-xs zyphex-subheading">This week</p>
              </CardContent>
            </Card>

            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Team Members</CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-heading">8</div>
                <p className="text-xs zyphex-subheading">Active members</p>
              </CardContent>
            </Card>

            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Unread</CardTitle>
                <Mail className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-heading">3</div>
                <p className="text-xs zyphex-subheading">New messages</p>
              </CardContent>
            </Card>

            <Card className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-heading">2h</div>
                <p className="text-xs zyphex-subheading">Average</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center py-20">
            <MessageSquare className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold zyphex-heading mb-2">Communication Center</h3>
            <p className="zyphex-subheading mb-6">Team communication features will be implemented here</p>
            <div className="flex justify-center gap-4">
              <Button className="zyphex-button" asChild>
                <Link href="/project-manager/team">
                  <Users className="h-4 w-4 mr-2" />
                  View Team
                </Link>
              </Button>
              <Button variant="outline" className="zyphex-button" asChild>
                <Link href="/project-manager">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}