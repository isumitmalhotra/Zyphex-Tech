"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Info, 
  Briefcase, 
  Mail, 
  FileText, 
  Settings,
  Edit3,
  Eye,
  Plus
} from "lucide-react"

// Define the pages available for content management
const websitePages = [
  {
    id: "home",
    name: "Home",
    path: "/",
    description: "Homepage with hero section, features, and call-to-actions",
    icon: Home,
    sections: ["Hero", "Features", "Services Preview", "Testimonials", "CTA"],
    status: "active"
  },
  {
    id: "about",
    name: "About",
    path: "/about",
    description: "Company information, team, and mission statement",
    icon: Info,
    sections: ["Hero", "Company Story", "Team", "Values"],
    status: "active"
  },
  {
    id: "services",
    name: "Services",
    path: "/services",
    description: "IT services and solutions offered",
    icon: Briefcase,
    sections: ["Hero", "Service Categories", "Process", "Pricing"],
    status: "active"
  },
  {
    id: "portfolio",
    name: "Portfolio",
    path: "/portfolio",
    description: "Project showcase and case studies",
    icon: FileText,
    sections: ["Hero", "Project Grid", "Case Studies", "Technologies"],
    status: "active"
  },
  {
    id: "contact",
    name: "Contact",
    path: "/contact",
    description: "Contact information and inquiry forms",
    icon: Mail,
    sections: ["Hero", "Contact Form", "Office Info", "Map"],
    status: "active"
  },
  {
    id: "blog",
    name: "Blog",
    path: "/blog",
    description: "Company blog and news updates",
    icon: FileText,
    sections: ["Hero", "Featured Posts", "Categories", "Archive"],
    status: "active"
  }
]

export default function ContentManagePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Management</h1>
        <p className="text-muted-foreground">
          Manage content for all pages on your website. Click on any page to edit its sections and content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websitePages.map((page) => {
          const IconComponent = page.icon
          
          return (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{page.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {page.path}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={page.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {page.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {page.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Content Sections:</h4>
                  <div className="flex flex-wrap gap-1">
                    {page.sections.map((section, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    asChild 
                    size="sm" 
                    className="flex-1"
                  >
                    <Link href={`/admin/content/manage/${page.id}`}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Manage Content
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                  >
                    <Link href={page.path} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Create New Content Type</h3>
                  <p className="text-sm text-muted-foreground">
                    Define new content structures
                  </p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/content/content-types">
                  Manage Content Types
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Global Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage headers, footers, and global elements
                  </p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/content/global">
                  Global Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Content Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure CMS preferences and defaults
                  </p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/content/settings">
                  CMS Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent content changes</p>
              <p className="text-sm">
                Start managing your content to see activity here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}