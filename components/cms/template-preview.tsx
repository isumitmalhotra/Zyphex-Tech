/**
 * CMS Template Preview Component
 * Preview template with sections
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, FileText, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';

interface TemplateSection {
  id: string;
  sectionKey: string;
  sectionType: string;
  title?: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  isPublic: boolean;
  sections: TemplateSection[];
  _count: {
    pages: number;
  };
}

interface TemplatePreviewProps {
  templateId: string;
  open: boolean;
  onClose: () => void;
  onApply?: (templateId: string) => void;
}

export function TemplatePreview({ templateId, open, onClose, onApply }: TemplatePreviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useCMSPermissions();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = hasPermission('cms.templates.edit');

  useEffect(() => {
    if (open && templateId) {
      fetchTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/templates/${templateId}`);
      const data = await response.json();

      if (data.success) {
        setTemplate(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch template');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template. Please try again.',
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (onApply && template) {
      onApply(template.id);
      onClose();
    }
  };

  const getSectionTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      hero: 'Hero',
      features: 'Features',
      testimonials: 'Testimonials',
      cta: 'Call to Action',
      content: 'Content',
      gallery: 'Gallery',
      faq: 'FAQ',
      custom: 'Custom',
    };
    return types[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : template ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl">{template.name}</DialogTitle>
                  <DialogDescription className="mt-2">
                    {template.description || 'No description provided'}
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary">{template.category}</Badge>
                {template.isPublic && <Badge variant="outline">Public</Badge>}
                <span className="text-sm text-muted-foreground">
                  • Used in {template._count.pages} page{template._count.pages !== 1 ? 's' : ''}
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Sections */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Template Sections ({template.sections.length})
                </h3>
                {template.sections.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        This template has no sections yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {template.sections.map((section, index) => (
                      <Card key={section.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {getSectionTypeDisplay(section.sectionType)}
                                </Badge>
                                <span className="font-mono text-sm text-muted-foreground">
                                  {section.sectionKey}
                                </span>
                              </div>
                              {section.title && (
                                <p className="text-sm mt-1">{section.title}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/admin/cms/templates/${template.id}/edit`);
                        onClose();
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </Button>
                  )}
                </div>
                {onApply && (
                  <Button onClick={handleApply}>
                    Apply Template
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-12">
            <p className="text-muted-foreground">Template not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
