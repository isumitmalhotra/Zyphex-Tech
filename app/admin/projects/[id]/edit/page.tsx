"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useRouter } from "next/navigation"

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <SubtleBackground />
      <div className="relative z-10">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer hover:text-blue-400"
                >
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => router.push("/admin/projects")}
                  className="cursor-pointer hover:text-blue-400"
                >
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => router.push(`/admin/projects/${params.id}`)}
                  className="cursor-pointer hover:text-blue-400"
                >
                  Project Details
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/projects/${params.id}`)}
                className="hover-zyphex-glow"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            </div>
          </div>

          {/* Edit Form */}
          <Card className="zyphex-glass-effect border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-2xl zyphex-text">Edit Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="zyphex-subheading text-lg">Edit functionality coming soon!</p>
                <p className="zyphex-subheading mt-2">
                  This will include a comprehensive form to edit all project details.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 hover-zyphex-glow"
                  onClick={() => router.push(`/admin/projects/${params.id}`)}
                >
                  Back to Project Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}