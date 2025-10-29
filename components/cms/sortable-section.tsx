/**
 * Sortable Section Component
 * Individual section item with drag-and-drop capability
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import { Section } from './section-list';
import { SectionEditor } from './section-editor';

interface SortableSectionProps {
  section: Section;
  isEditing: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: (isVisible: boolean) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  pageId: string;
}

export function SortableSection({
  section,
  isEditing,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onCancelEdit,
  onSave,
  pageId,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get section type display name
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

  // If editing, show the editor
  if (isEditing) {
    return (
      <Card className="p-6">
        <SectionEditor
          pageId={pageId}
          section={section}
          onCancel={onCancelEdit}
          onSave={onSave}
        />
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${!section.isVisible ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{getSectionTypeDisplay(section.sectionType)}</Badge>
            {!section.isVisible && (
              <Badge variant="secondary">
                <EyeOff className="w-3 h-3 mr-1" />
                Hidden
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{section.sectionKey}</span>
            {section.title && (
              <>
                <span>•</span>
                <span className="truncate">{section.title}</span>
              </>
            )}
          </div>
          
          {/* Device Visibility */}
          <div className="flex items-center gap-3 mt-2">
            <div className={`flex items-center gap-1 text-xs ${section.showOnDesktop ? 'text-foreground' : 'text-muted-foreground'}`}>
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${section.showOnTablet ? 'text-foreground' : 'text-muted-foreground'}`}>
              <Tablet className="w-3 h-3" />
              <span>Tablet</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${section.showOnMobile ? 'text-foreground' : 'text-muted-foreground'}`}>
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </div>
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {section.isVisible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Switch
              checked={section.isVisible}
              onCheckedChange={onToggleVisibility}
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
