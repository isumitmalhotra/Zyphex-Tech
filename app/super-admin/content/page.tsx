"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Search, 
  Plus,
  Image as ImageIcon,
  Settings,
  Layout
} from "lucide-react"
import { useState } from "react"

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <p className="text-muted-foreground">
            Manage your website content, pages, and media
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="content">Dynamic Content</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
          <TabsTrigger value="types">Content Types</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Website Pages</CardTitle>
                  <CardDescription>Manage all pages on your website</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pages..."
                    className="pl-8 w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Home Page", url: "/", status: "Published", lastModified: "2 hours ago" },
                  { name: "About Us", url: "/about", status: "Published", lastModified: "1 day ago" },
                  { name: "Services", url: "/services", status: "Published", lastModified: "3 days ago" },
                  { name: "Contact", url: "/contact", status: "Published", lastModified: "1 week ago" },
                  { name: "Blog", url: "/blog", status: "Draft", lastModified: "2 weeks ago" },
                ].map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layout className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{page.name}</p>
                        <p className="text-sm text-muted-foreground">{page.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{page.status}</p>
                        <p className="text-xs text-muted-foreground">Modified {page.lastModified}</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Content Sections</CardTitle>
              <CardDescription>Manage reusable content blocks and sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Hero Section", type: "Hero", pages: 1 },
                  { name: "Features Grid", type: "Features", pages: 3 },
                  { name: "Testimonials", type: "Testimonials", pages: 2 },
                  { name: "CTA Banner", type: "Call to Action", pages: 5 },
                ].map((content, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{content.name}</p>
                        <p className="text-sm text-muted-foreground">Type: {content.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">Used in {content.pages} pages</p>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>Upload and manage images, videos, and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div key={i} className="aspect-square border rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 cursor-pointer">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
              <CardDescription>Define custom content structures and fields</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Blog Post", fields: 8, entries: 24 },
                  { name: "Service", fields: 6, entries: 12 },
                  { name: "Team Member", fields: 5, entries: 15 },
                  { name: "Portfolio Item", fields: 10, entries: 32 },
                ].map((type, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-muted-foreground">{type.fields} fields • {type.entries} entries</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">View Entries</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
