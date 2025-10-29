/**
 * Example: Responsive CMS Pages Table
 * Demonstrates usage of ResponsiveTable component
 */

'use client';

import React from 'react';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface CmsPage {
  id: string;
  pageTitle: string;
  slug: string;
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
  pageType: string;
  createdAt: Date;
  updatedAt: Date;
}

export function CmsPagesTable({ pages }: { pages: CmsPage[] }) {
  const columns: ResponsiveTableColumn<CmsPage>[] = [
    {
      key: 'pageTitle',
      label: 'Page Title',
      mobileLabel: 'Title',
      render: (page) => (
        <div className="font-medium">{page.pageTitle}</div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      hideOnMobile: true,
      render: (page) => (
        <span className="text-muted-foreground text-sm">/{page.slug}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (page) => (
        <Badge variant={getStatusVariant(page.status)}>
          {page.status}
        </Badge>
      ),
    },
    {
      key: 'pageType',
      label: 'Type',
      mobileLabel: 'Type',
      hideOnMobile: true,
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      mobileLabel: 'Updated',
      render: (page) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  // Custom mobile card renderer (optional - overrides default)
  const mobileCardRender = (page: CmsPage) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{page.pageTitle}</h4>
          <p className="text-sm text-muted-foreground truncate">/{page.slug}</p>
        </div>
        <Badge variant={getStatusVariant(page.status)} className="flex-shrink-0">
          {page.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{page.pageType}</span>
        <span>{formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}</span>
      </div>
    </div>
  );

  return (
    <ResponsiveTable
      data={pages}
      columns={columns}
      keyExtractor={(page) => page.id}
      onRowClick={(page) => {
        // Navigate to page editor
        window.location.href = `/super-admin/cms/pages/${page.id}/edit`;
      }}
      emptyMessage="No pages found"
      mobileCardRender={mobileCardRender}
    />
  );
}

function getStatusVariant(status: CmsPage['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'review':
      return 'outline';
    case 'archived':
      return 'destructive';
    default:
      return 'secondary';
  }
}
