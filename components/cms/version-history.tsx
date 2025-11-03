/**
 * CMS Version History Component
 * Display and manage page version history with full diff comparison
 * 
 * Features:
 * - Timeline view of all versions
 * - Visual diff comparison
 * - One-click restore
 * - Version statistics
 * - Auto-refresh on changes
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  History, 
  RotateCcw, 
  GitCompare,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Tag,
  Plus,
  Minus,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface PageVersion {
  id: string;
  versionNumber: number;
  changeDescription?: string | null;
  createdBy: string;
  createdAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  tags: string[];
}

interface VersionStats {
  totalVersions: number;
  latestVersionNumber: number;
  publishedVersions: number;
  latestVersion: {
    versionNumber: number;
    createdAt: string;
    createdBy: string;
  } | null;
}

interface VersionComparison {
  version1: {
    versionNumber: number;
    createdAt: string;
    createdBy: string;
  };
  version2: {
    versionNumber: number;
    createdAt: string;
    createdBy: string;
  };
  pageChanges: Record<string, { old: unknown; new: unknown }>;
  sectionChanges: Array<{
    type: 'added' | 'removed' | 'modified';
    sectionKey: string;
    section?: unknown;
    changes?: Record<string, { old: unknown; new: unknown }>;
  }>;
}

interface VersionHistoryProps {
  pageId: string;
  showStats?: boolean;
}

export function VersionHistory({ pageId, showStats = true }: VersionHistoryProps) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [versionToCompare, setVersionToCompare] = useState<PageVersion | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.data.versions || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.message || 'Failed to fetch versions');
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      const response = await fetch(
        `/api/cms/pages/${pageId}/versions/${selectedVersion.id}/restore`, 
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || `Restored to version ${selectedVersion.versionNumber}`,
        });
        setShowRestoreDialog(false);
        setSelectedVersion(null);
        fetchVersions(); // Refresh list
      } else {
        throw new Error(data.message || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore version',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleCompare = async (version: PageVersion) => {
    // Compare with latest version
    const latestVersion = versions[0];
    if (!latestVersion || version.id === latestVersion.id) {
      toast({
        title: 'Cannot Compare',
        description: 'Please select a different version to compare',
        variant: 'destructive',
      });
      return;
    }

    setVersionToCompare(version);
    setSelectedVersion(latestVersion);
    setComparing(true);
    setShowDiffDialog(true);

    try {
      const response = await fetch(
        `/api/cms/pages/${pageId}/versions/compare?v1=${version.id}&v2=${latestVersion.id}`
      );
      const data = await response.json();

      if (data.success) {
        setComparison(data.data);
      } else {
        throw new Error(data.message || 'Failed to compare versions');
      }
    } catch (error) {
      console.error('Failed to compare versions:', error);
      toast({
        title: 'Error',
        description: 'Failed to compare versions',
        variant: 'destructive',
      });
      setShowDiffDialog(false);
    } finally {
      setComparing(false);
    }
  };

  const isLatestVersion = (version: PageVersion) => {
    return version.versionNumber === versions[0]?.versionNumber;
  };

  const renderValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading version history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" />
                Total Versions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVersions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Latest Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">v{stats.latestVersionNumber}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedVersions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.latestVersion 
                  ? formatDistanceToNow(new Date(stats.latestVersion.createdAt), { addSuffix: true })
                  : 'Never'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Version History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Version History
              </CardTitle>
              <CardDescription>
                View and restore previous versions of this page
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              {versions.length} {versions.length === 1 ? 'version' : 'versions'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No version history yet</p>
              <p className="text-sm">Versions will be created automatically when you edit this page</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Version</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version, index) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-base">
                            v{version.versionNumber}
                          </span>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Latest
                            </Badge>
                          )}
                          {version.isPublished && (
                            <Badge variant="secondary" className="text-xs">
                              Published
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm line-clamp-2">
                            {version.changeDescription || <span className="text-muted-foreground italic">No description</span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {version.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {version.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {version.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{version.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isLatestVersion(version) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompare(version)}
                              >
                                <GitCompare className="w-4 h-4 mr-1" />
                                Compare
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedVersion(version);
                                  setShowRestoreDialog(true);
                                }}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Restore
                              </Button>
                            </>
                          )}
                          {isLatestVersion(version) && (
                            <Badge variant="outline" className="text-xs px-3">
                              Current Version
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore to version {selectedVersion?.versionNumber}?
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <span className="font-mono font-semibold">v{selectedVersion.versionNumber}</span>
                </div>
                {selectedVersion.isPublished && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <Badge variant="secondary">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Published
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(selectedVersion.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {selectedVersion.changeDescription && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description</span>
                    <p className="text-sm mt-1">{selectedVersion.changeDescription}</p>
                  </div>
                )}
                {selectedVersion.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVersion.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Important Information
                    </p>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                      <li>This will restore the page to this version&apos;s state</li>
                      <li>A new version will be created (history preserved)</li>
                      <li>All current sections will be replaced</li>
                      <li>You can undo this by restoring to another version</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoring}
            >
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Comparison Dialog */}
      <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Comparing v{versionToCompare?.versionNumber} with v{selectedVersion?.versionNumber} (latest)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[600px] pr-4">
            {comparing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading comparison...</span>
              </div>
            ) : comparison ? (
              <div className="space-y-6">
                {/* Page-level Changes */}
                {Object.keys(comparison.pageChanges).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Page Changes ({Object.keys(comparison.pageChanges).length})
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(comparison.pageChanges).map(([field, change]) => (
                        <div key={field} className="rounded-lg border p-4">
                          <div className="font-medium text-sm text-muted-foreground mb-2">
                            {field}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase">
                                Old Value (v{versionToCompare?.versionNumber})
                              </div>
                              <div className="rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                  {renderValue(change.old)}
                                </pre>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase">
                                New Value (v{selectedVersion?.versionNumber})
                              </div>
                              <div className="rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                  {renderValue(change.new)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Changes */}
                {comparison.sectionChanges.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        Section Changes ({comparison.sectionChanges.length})
                      </h3>
                      <div className="space-y-3">
                        {comparison.sectionChanges.map((change, index) => (
                          <div key={index} className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 mb-3">
                              {change.type === 'added' && (
                                <Badge variant="default" className="bg-green-600">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Added
                                </Badge>
                              )}
                              {change.type === 'removed' && (
                                <Badge variant="destructive">
                                  <Minus className="w-3 h-3 mr-1" />
                                  Removed
                                </Badge>
                              )}
                              {change.type === 'modified' && (
                                <Badge variant="secondary">
                                  <Edit className="w-3 h-3 mr-1" />
                                  Modified
                                </Badge>
                              )}
                              <span className="font-mono text-sm font-medium">
                                {change.sectionKey}
                              </span>
                            </div>

                            {change.type === 'modified' && change.changes && (
                              <div className="space-y-2 mt-3">
                                {Object.entries(change.changes).map(([field, fieldChange]) => (
                                  <div key={field} className="text-sm">
                                    <div className="font-medium text-muted-foreground mb-1">
                                      {field}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2">
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                          {renderValue(fieldChange.old)}
                                        </pre>
                                      </div>
                                      <div className="rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2">
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                          {renderValue(fieldChange.new)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(change.type === 'added' || change.type === 'removed') && (
                              <div className="mt-3 rounded bg-muted p-3">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                  {renderValue(change.section)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* No Changes */}
                {Object.keys(comparison.pageChanges).length === 0 && 
                 comparison.sectionChanges.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Differences Found</p>
                    <p className="text-sm mt-2">These versions are identical</p>
                  </div>
                )}
              </div>
            ) : null}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiffDialog(false)}>
              Close
            </Button>
            {versionToCompare && !isLatestVersion(versionToCompare) && (
              <Button
                onClick={() => {
                  setShowDiffDialog(false);
                  setSelectedVersion(versionToCompare);
                  setShowRestoreDialog(true);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore v{versionToCompare.versionNumber}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
