/**
 * Dashboard Pages - Test/Demo Route
 * Simplified test page for Playwright E2E responsive design tests
 * Displays a sample list using ResponsiveTable without authentication
 */

'use client';

import { useState } from 'react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileNavWrapper } from '@/components/mobile-nav-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Sample data for demonstration
const samplePages = [
  { id: 1, title: 'Home Page', slug: 'home', status: 'published', views: 1234 },
  { id: 2, title: 'About Us', slug: 'about', status: 'published', views: 856 },
  { id: 3, title: 'Services', slug: 'services', status: 'draft', views: 0 },
  { id: 4, title: 'Contact', slug: 'contact', status: 'published', views: 432 },
  { id: 5, title: 'Blog', slug: 'blog', status: 'published', views: 2341 },
];

export default function DashboardPagesTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const filteredPages = samplePages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (page: typeof samplePages[0]) => (
        <div className="font-medium">{page.title}</div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (page: typeof samplePages[0]) => (
        <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
          {page.status}
        </Badge>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      hideOnMobile: true,
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar - visible only on desktop (≥ 768px) */}
        <aside data-testid="desktop-sidebar" className="hidden md:block w-64 border-r bg-background">
          <AdminSidebar />
        </aside>

        {/* Mobile Navigation + Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileNavWrapper
            sidebarContent={<AdminSidebar />}
            headerContent={
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold">Pages</h1>
              </div>
            }
          >
            <main className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 space-y-6">{/* Stats */}
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="pages-stats-cards">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Pages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-pages">
                      {samplePages.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Published
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {samplePages.filter(p => p.status === 'published').length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {samplePages.reduce((sum, p) => sum + p.views, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <Input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  data-testid="pages-search-input"
                />
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="pages-refresh-button">
                    Refresh
                  </Button>
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="pages-add-button">
                        Create Page
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      data-testid="responsive-modal"
                      className="sm:max-w-[425px] md:max-w-[600px] w-full max-h-[90vh] md:max-h-[80vh]"
                    >
                      <DialogHeader>
                        <DialogTitle>Create New Page</DialogTitle>
                        <DialogDescription>
                          Add a new page to your website. Fill in the details below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="page-title" className="text-sm font-medium">
                            Page Title
                          </label>
                          <Input
                            id="page-title"
                            placeholder="Enter page title"
                            className="w-full"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="page-slug" className="text-sm font-medium">
                            Slug
                          </label>
                          <Input
                            id="page-slug"
                            placeholder="page-url-slug"
                            className="w-full"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="page-status" className="text-sm font-medium">
                            Status
                          </label>
                          <select
                            id="page-status"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          onClick={() => {
                            // Simulate page creation
                            setIsModalOpen(false);
                          }}
                        >
                          Create Page
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Table */}
              <ResponsiveTable
                columns={columns}
                data={filteredPages}
                keyExtractor={(page) => page.id.toString()}
                emptyMessage="No pages found"
              />
            </div>
          </main>
        </MobileNavWrapper>
      </div>
      </div>
    </SidebarProvider>
  );
}
