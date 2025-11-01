import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - don't try to statically generate at build time
export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: {
    slug: string[]
  }
}

// Remove generateStaticParams to avoid database queries at build time
// Pages will be generated on-demand

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const path = '/' + (params.slug?.join('/') || '')
  
  const page = await prisma.page.findFirst({
    where: {
      path,
      isActive: true
    }
  })

  if (!page) {
    return {
      title: 'Page Not Found'
    }
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.description || undefined
  }
}

// Main page component
export default async function DynamicPage({ params }: PageProps) {
  const path = '/' + (params.slug?.join('/') || '')
  
  const page = await prisma.page.findFirst({
    where: {
      path,
      isActive: true
    }
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold">{page.title}</h1>
          {page.description && (
            <p className="text-muted-foreground mt-2 text-lg">
              {page.description}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* This is a basic template. You can enhance this with actual content sections */}
            <div className="bg-card rounded-lg border p-8">
              <h2 className="text-2xl font-semibold mb-4">
                Welcome to {page.title}
              </h2>
              
              {page.description && (
                <p className="text-muted-foreground mb-6">
                  {page.description}
                </p>
              )}

              <div className="space-y-4">
                <p>
                  This is a dynamically generated page from your CMS. 
                  You can customize the content by editing this page in the 
                  <strong> Super Admin Content Management</strong> section.
                </p>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Page Information:</h3>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Title:</strong> {page.title}</li>
                    <li><strong>Slug:</strong> {page.slug}</li>
                    <li><strong>Path:</strong> {page.path}</li>
                    <li><strong>Status:</strong> {page.isActive ? 'Published' : 'Draft'}</li>
                  </ul>
                </div>

                <div className="border-t pt-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> To add rich content to this page, you&apos;ll need to:
                  </p>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Add a content field to the Page model in your database</li>
                    <li>Update the page editor to support rich text editing</li>
                    <li>Update this template to render the content field</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Last updated: {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  )
}
