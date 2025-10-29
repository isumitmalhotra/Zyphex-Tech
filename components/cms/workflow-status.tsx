/**
 * CMS Workflow Status Component
 * Display and manage content workflow (submit, review, approve/reject)
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface WorkflowStatus {
  id: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'published';
  submittedAt?: string;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewNotes?: string;
  approvedAt?: string;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  rejectedAt?: string;
  rejectedBy?: {
    id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
}

interface WorkflowStatusProps {
  pageId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

export function WorkflowStatus({ pageId, currentStatus, onStatusChange }: WorkflowStatusProps) {
  const [workflow, setWorkflow] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  const { hasPermission } = useCMSPermissions();
  const { toast } = useToast();

  const canSubmit = hasPermission('cms.workflows.submit');
  const canApprove = hasPermission('cms.workflows.approve');
  const canReject = hasPermission('cms.workflows.reject');

  useEffect(() => {
    fetchWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/workflow`);
      const data = await response.json();

      if (data.success) {
        setWorkflow(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/workflow/submit`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page submitted for review',
        });
        setShowSubmitDialog(false);
        fetchWorkflow();
        onStatusChange?.();
      } else {
        throw new Error(data.message || 'Failed to submit');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide review notes',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const endpoint = reviewAction === 'approve' 
        ? `/api/cms/pages/${pageId}/workflow/approve`
        : `/api/cms/pages/${pageId}/workflow/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: reviewAction === 'approve' 
            ? 'Page approved successfully'
            : 'Page rejected with feedback',
        });
        setShowReviewDialog(false);
        setReviewNotes('');
        fetchWorkflow();
        onStatusChange?.();
      } else {
        throw new Error(data.message || `Failed to ${reviewAction}`);
      }
    } catch (error) {
      console.error(`Failed to ${reviewAction}:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${reviewAction}`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'default';
      case 'submitted':
      case 'in_review':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'draft':
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'submitted':
      case 'in_review':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'draft':
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const showSubmitButton = canSubmit && ['draft', 'rejected'].includes(currentStatus);
  const showReviewButtons = (canApprove || canReject) && ['submitted', 'in_review'].includes(currentStatus);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Workflow Status
              </CardTitle>
              <CardDescription>
                Content submission and review workflow
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(currentStatus)} className="flex items-center gap-1">
              {getStatusIcon(currentStatus)}
              {currentStatus.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workflow Timeline */}
          <div className="space-y-4">
            {/* Submitted */}
            {workflow?.submittedAt && (
              <div className="flex items-start gap-4 border-l-2 border-primary pl-4 py-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Submitted for Review</h4>
                  <p className="text-sm text-muted-foreground">
                    by {workflow.submittedBy?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(workflow.submittedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Reviewed */}
            {workflow?.reviewedAt && workflow?.reviewNotes && (
              <div className="flex items-start gap-4 border-l-2 border-secondary pl-4 py-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-secondary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Under Review</h4>
                  <p className="text-sm text-muted-foreground">
                    by {workflow.reviewedBy?.name}
                  </p>
                  <p className="text-sm mt-2 p-3 bg-muted rounded">
                    {workflow.reviewNotes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(workflow.reviewedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Approved */}
            {workflow?.approvedAt && (
              <div className="flex items-start gap-4 border-l-2 border-green-500 pl-4 py-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-600">Approved</h4>
                  <p className="text-sm text-muted-foreground">
                    by {workflow.approvedBy?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(workflow.approvedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {workflow?.rejectedAt && (
              <div className="flex items-start gap-4 border-l-2 border-destructive pl-4 py-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-destructive-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive">Rejected</h4>
                  <p className="text-sm text-muted-foreground">
                    by {workflow.rejectedBy?.name}
                  </p>
                  {workflow.rejectionReason && (
                    <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded">
                      <p className="text-sm font-medium flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4" />
                        Rejection Reason
                      </p>
                      <p className="text-sm">{workflow.rejectionReason}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(workflow.rejectedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Draft state */}
            {currentStatus === 'draft' && !workflow?.submittedAt && (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>This page has not been submitted for review yet</p>
                {canSubmit && (
                  <p className="text-sm mt-2">Click the button below to submit</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {showSubmitButton && (
              <Button onClick={() => setShowSubmitDialog(true)} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            )}

            {showReviewButtons && (
              <>
                {canApprove && (
                  <Button
                    onClick={() => {
                      setReviewAction('approve');
                      setShowReviewDialog(true);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                {canReject && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setReviewAction('reject');
                      setShowReviewDialog(true);
                    }}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Review</DialogTitle>
            <DialogDescription>
              Submit this page for review by a project manager or admin
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Once submitted, the page will be reviewed before it can be published.
              You will be notified when the review is complete.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Page' : 'Reject Page'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'Approve this page for publication'
                : 'Reject this page and provide feedback'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="review-notes">
                {reviewAction === 'approve' ? 'Review Notes' : 'Rejection Reason'} *
              </Label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add notes about your review...'
                    : 'Explain why this page is being rejected...'
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setReviewNotes('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={actionLoading || !reviewNotes.trim()}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
