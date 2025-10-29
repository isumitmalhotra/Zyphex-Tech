/**
 * CMS Section List Component
 * Displays and manages page sections with drag-and-drop reordering
 */

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSection } from './sortable-section';
import { SectionTypeSelector } from './section-type-selector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';

export interface Section {
  id: string;
  sectionKey: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  content: Record<string, unknown>;
  order: number;
  isVisible: boolean;
  showOnMobile: boolean;
  showOnTablet: boolean;
  showOnDesktop: boolean;
  cssClasses?: string;
  customStyles?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SectionListProps {
  pageId: string;
}

export function SectionList({ pageId }: SectionListProps) {
  const { toast } = useToast();
  const { hasPermission } = useCMSPermissions();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const canEdit = hasPermission('cms.sections.edit');
  const canCreate = hasPermission('cms.sections.create');
  const canDelete = hasPermission('cms.sections.delete');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/sections`);
      const data = await response.json();

      if (data.success) {
        setSections(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch sections');
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sections. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    // Optimistic update
    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    // Update server
    setReordering(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/sections/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionIds: newSections.map((s: Section) => s.id),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to reorder sections');
      }

      toast({
        title: 'Success',
        description: 'Sections reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering sections:', error);
      // Revert on error
      setSections(sections);
      toast({
        title: 'Error',
        description: 'Failed to reorder sections. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReordering(false);
    }
  };

  // Handle add section
  const handleAddSection = async (sectionType: string) => {
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType,
          sectionKey: `${sectionType}-${Date.now()}`,
          title: '',
          content: {},
          order: sections.length,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSections([...sections, data.data]);
        setShowSelector(false);
        setEditingSection(data.data.id);
        toast({
          title: 'Success',
          description: 'Section added successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to add section');
      }
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: 'Error',
        description: 'Failed to add section. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete section
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/pages/${pageId}/sections/${sectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSections(sections.filter((s) => s.id !== sectionId));
        toast({
          title: 'Success',
          description: 'Section deleted successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle duplicate section
  const handleDuplicateSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/sections/${sectionId}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSections([...sections, data.data]);
        toast({
          title: 'Success',
          description: 'Section duplicated successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to duplicate section');
      }
    } catch (error) {
      console.error('Error duplicating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate section. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle toggle visibility
  const handleToggleVisibility = async (sectionId: string, isVisible: boolean) => {
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      });

      const data = await response.json();

      if (data.success) {
        setSections(sections.map((s) => 
          s.id === sectionId ? { ...s, isVisible } : s
        ));
      } else {
        throw new Error(data.error || 'Failed to update section');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to update section visibility.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          You don&apos;t have permission to manage sections.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Page Sections</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder, click to edit
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowSelector(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        )}
      </div>

      {/* Section Type Selector */}
      {showSelector && (
        <SectionTypeSelector
          onSelect={handleAddSection}
          onCancel={() => setShowSelector(false)}
        />
      )}

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first section to this page
              </p>
              {canCreate && (
                <Button onClick={() => setShowSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isEditing={editingSection === section.id}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setEditingSection(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onDuplicate={() => handleDuplicateSection(section.id)}
                  onToggleVisibility={(isVisible: boolean) =>
                    handleToggleVisibility(section.id, isVisible)
                  }
                  onCancelEdit={() => setEditingSection(null)}
                  onSave={fetchSections}
                  pageId={pageId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Reordering indicator */}
      {reordering && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Reordering sections...</span>
        </div>
      )}
    </div>
  );
}
