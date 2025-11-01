'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageEditor } from '@/components/content/page-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Page {
  id: string
  title: string
  slug: string
  path: string
  description?: string
  metaTitle?: string
  metaDescription?: string
  isActive: boolean
  isSystem: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export default function EditPagePage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.id as string
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(async () => {
    // Guard against undefined pageId
    if (!pageId || pageId === 'undefined') {
      setError('Invalid page ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/super-admin/content/pages/${pageId}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Page not found')
        }
        throw new Error('Failed to load page')
      }
      
      const data = await res.json()
      setPage(data)
    } catch (err) {
      console.error('Error fetching page:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  const handleSaveSuccess = () => {
    // Refresh page data after save
    fetchPage()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
          <p className="text-destructive">{error}</p>
          <Button
            onClick={() => router.push('/super-admin/content/pages')}
            className="mt-4"
          >
            Back to Pages
          </Button>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/super-admin/content/pages')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Page</h1>
          <p className="text-muted-foreground">
            Modify page content, metadata, and settings
          </p>
        </div>
      </div>

      <PageEditor 
        page={page} 
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  )
}
