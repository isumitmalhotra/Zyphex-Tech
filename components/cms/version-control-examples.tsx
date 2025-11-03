/**
 * Version Control UI Usage Examples
 * 
 * This file demonstrates how to use the version control UI components
 * in different scenarios.
 */

import { VersionHistory } from '@/components/cms/version-history';
import { VersionStatsWidget } from '@/components/cms/version-stats-widget';
import { ManualVersionSave } from '@/components/cms/manual-version-save';

// ============================================================================
// Example 1: Full Version History Page
// ============================================================================

export function VersionHistoryPage({ pageId }: { pageId: string }) {
  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Version History with Stats */}
      <VersionHistory pageId={pageId} showStats={true} />
    </div>
  );
}

// ============================================================================
// Example 2: Version History Without Stats
// ============================================================================

export function CompactVersionHistory({ pageId }: { pageId: string }) {
  return (
    <div className="container max-w-7xl py-8">
      {/* Version History Only (no stats) */}
      <VersionHistory pageId={pageId} showStats={false} />
    </div>
  );
}

// ============================================================================
// Example 3: Stats Widget in Dashboard
// ============================================================================

export function DashboardWithStats({ pageId }: { pageId: string }) {
  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Grid variant (4 cards) */}
      <VersionStatsWidget pageId={pageId} variant="grid" />

      {/* Other dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compact stats in sidebar */}
        <div>
          <VersionStatsWidget pageId={pageId} variant="compact" />
        </div>
        
        <div className="md:col-span-2">
          {/* Main content */}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Page Editor with Manual Save
// ============================================================================

export function PageEditorWithVersions({ pageId }: { pageId: string }) {
  const handleVersionCreated = () => {
    // Refresh version list or show success message
    console.log('New checkpoint created!');
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Page</h1>
        
        {/* Manual checkpoint button */}
        <ManualVersionSave 
          pageId={pageId} 
          onVersionCreated={handleVersionCreated}
          variant="outline"
          size="default"
        />
      </div>

      {/* Page editor content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Editor form */}
        </div>
        
        <div>
          {/* Stats in sidebar */}
          <VersionStatsWidget pageId={pageId} variant="compact" />
        </div>
      </div>

      {/* Version history at bottom */}
      <VersionHistory pageId={pageId} showStats={false} />
    </div>
  );
}

// ============================================================================
// Example 5: Complete CMS Page Management
// ============================================================================

export function CompletePageManagement({ pageId }: { pageId: string }) {
  const handleVersionCreated = () => {
    // Could trigger a refresh of the version history
    window.location.reload();
  };

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Page Management</h1>
          <p className="text-muted-foreground mt-2">
            Edit, version, and restore your page content
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ManualVersionSave 
            pageId={pageId} 
            onVersionCreated={handleVersionCreated}
            variant="outline"
          />
          <button className="btn-primary">
            Publish Page
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <VersionStatsWidget pageId={pageId} variant="grid" />

      {/* Main Editor Content */}
      <div className="rounded-lg border p-6 bg-card">
        {/* Your page editor form here */}
        <p className="text-muted-foreground">Page editor content...</p>
      </div>

      {/* Version History */}
      <VersionHistory pageId={pageId} showStats={false} />
    </div>
  );
}

// ============================================================================
// Example 6: Version History Tab in Page Editor
// ============================================================================

export function PageEditorWithTabs({ pageId }: { pageId: string }) {
  return (
    <div className="container max-w-7xl py-8">
      {/* Tabs: Content | Settings | Versions */}
      <div className="border rounded-lg">
        <div className="border-b bg-muted/50 px-6 py-3">
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-md bg-background font-medium">
              Content
            </button>
            <button className="px-4 py-2 rounded-md hover:bg-background/50">
              Settings
            </button>
            <button className="px-4 py-2 rounded-md hover:bg-background/50">
              Versions
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* When "Versions" tab is active: */}
          <VersionHistory pageId={pageId} showStats={true} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Minimal Version List
// ============================================================================

export function MinimalVersionList({ pageId }: { pageId: string }) {
  return (
    <div className="space-y-4">
      {/* Just the version history table, no stats */}
      <VersionHistory pageId={pageId} showStats={false} />
    </div>
  );
}

// ============================================================================
// Example 8: Version Stats Only (Dashboard Widget)
// ============================================================================

export function StatsOnlyWidget({ pageId }: { pageId: string }) {
  return (
    <div>
      {/* Compact stats card for sidebar/dashboard */}
      <VersionStatsWidget pageId={pageId} variant="compact" />
    </div>
  );
}

// ============================================================================
// Example 9: Button Variants for Manual Save
// ============================================================================

export function ManualSaveButtonVariants({ pageId }: { pageId: string }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Default style */}
      <ManualVersionSave pageId={pageId} variant="default" />
      
      {/* Outline style */}
      <ManualVersionSave pageId={pageId} variant="outline" />
      
      {/* Secondary style */}
      <ManualVersionSave pageId={pageId} variant="secondary" />
      
      {/* Small size */}
      <ManualVersionSave pageId={pageId} variant="outline" size="sm" />
      
      {/* Large size */}
      <ManualVersionSave pageId={pageId} variant="default" size="lg" />
    </div>
  );
}

// ============================================================================
// API Integration Example
// ============================================================================

export async function fetchVersionData(pageId: string) {
  // Example of manually fetching version data (usually handled by components)
  
  // Get all versions
  const versionsResponse = await fetch(`/api/cms/pages/${pageId}/versions`);
  const { data: { versions, stats } } = await versionsResponse.json();

  // Get specific version
  const versionResponse = await fetch(`/api/cms/pages/${pageId}/versions/${versions[0].id}`);
  const { data: version } = await versionResponse.json();

  // Compare versions
  const compareResponse = await fetch(
    `/api/cms/pages/${pageId}/versions/compare?v1=${versions[1].id}&v2=${versions[0].id}`
  );
  const { data: comparison } = await compareResponse.json();

  return { versions, stats, version, comparison };
}
