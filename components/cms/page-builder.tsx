/**
 * CMS Page Builder Component
 * 
 * Comprehensive page builder with:
 * - Drag-and-drop section management
 * - Template selection and application
 * - Section configuration forms
 * - Live preview
 * - Workflow management
 * - Version control
 * - Super Admin only access
 * 
 * @module components/cms/page-builder
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Eye,
  Save,
  X,
  Layers,
  Settings,
  Copy,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Section {
  id: string;
  sectionType: string;
  title: string;
  content: Record<string, unknown>;
  order: number;
  isVisible: boolean;
  customStyles?: Record<string, unknown>;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  templateStructure: {
    sections: Array<{
      sectionKey: string;
      sectionType: string;
      title: string;
      isRequired: boolean;
      isEditable: boolean;
      defaultContent?: Record<string, unknown>;
    }>;
  };
}

interface PageData {
  id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  templateId?: string;
  sections: Section[];
}

interface PageBuilderProps {
  pageId?: string;
  initialData?: Partial<PageData>;
  onSave?: (data: PageData) => Promise<void>;
  onCancel?: () => void;
}

// ============================================================================
// Sortable Section Item Component
// ============================================================================

function SortableSection({
  section,
  onEdit,
  onDelete,
  onToggleVisibility,
  onDuplicate,
}: {
  section: Section;
  onEdit: (section: Section) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDuplicate: (section: Section) => void;
}) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 mb-3 ${
        !section.isVisible ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{section.title}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {section.sectionType}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Order: {section.order}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleVisibility(section.id)}
            className="p-2 hover:bg-gray-100 rounded"
            title={section.isVisible ? 'Hide section' : 'Show section'}
          >
            <Eye className={`w-4 h-4 ${section.isVisible ? 'text-blue-600' : 'text-gray-400'}`} />
          </button>
          
          <button
            onClick={() => onDuplicate(section)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Duplicate section"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={() => onEdit(section)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Edit section"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={() => onDelete(section.id)}
            className="p-2 hover:bg-red-50 rounded"
            title="Delete section"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Builder Component
// ============================================================================

export default function PageBuilder({
  pageId,
  initialData,
  onSave,
  onCancel,
}: PageBuilderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // State
  const [pageData, setPageData] = useState<PageData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    status: initialData?.status || 'draft',
    templateId: initialData?.templateId,
    sections: initialData?.sections || [],
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(!pageId);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'preview'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check Super Admin access
  useEffect(() => {
    if (session && session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/cms/templates?isActive=true');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPageData((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
        const newIndex = prev.sections.findIndex((s) => s.id === over.id);

        const reordered = arrayMove(prev.sections, oldIndex, newIndex);
        return {
          ...prev,
          sections: reordered.map((section, index) => ({
            ...section,
            order: index,
          })),
        };
      });
    }
  }, []);

  // Apply template
  const handleApplyTemplate = useCallback((template: Template) => {
    const newSections: Section[] = template.templateStructure.sections.map((section, index) => ({
      id: `section-${Date.now()}-${index}`,
      sectionType: section.sectionType,
      title: section.title,
      content: section.defaultContent || {},
      order: index,
      isVisible: true,
      customStyles: {},
    }));

    setPageData((prev) => ({
      ...prev,
      templateId: template.id,
      sections: newSections,
    }));

    setShowTemplateSelector(false);
  }, []);

  // Add new section
  const handleAddSection = useCallback(() => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      sectionType: 'content',
      title: 'New Section',
      content: {},
      order: pageData.sections.length,
      isVisible: true,
    };

    setEditingSection(newSection);
    setShowSectionForm(true);
  }, [pageData.sections.length]);

  // Edit section
  const handleEditSection = useCallback((section: Section) => {
    setEditingSection(section);
    setShowSectionForm(true);
  }, []);

  // Save section
  const handleSaveSection = useCallback((section: Section) => {
    setPageData((prev) => {
      const existingIndex = prev.sections.findIndex((s) => s.id === section.id);
      
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev.sections];
        updated[existingIndex] = section;
        return { ...prev, sections: updated };
      } else {
        // Add new
        return { ...prev, sections: [...prev.sections, section] };
      }
    });

    setShowSectionForm(false);
    setEditingSection(null);
  }, []);

  // Delete section
  const handleDeleteSection = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setPageData((prev) => ({
        ...prev,
        sections: prev.sections
          .filter((s) => s.id !== id)
          .map((s, index) => ({ ...s, order: index })),
      }));
    }
  }, []);

  // Toggle section visibility
  const handleToggleVisibility = useCallback((id: string) => {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, isVisible: !s.isVisible } : s
      ),
    }));
  }, []);

  // Duplicate section
  const handleDuplicateSection = useCallback((section: Section) => {
    const duplicated: Section = {
      ...section,
      id: `section-${Date.now()}`,
      title: `${section.title} (Copy)`,
      order: pageData.sections.length,
    };

    setPageData((prev) => ({
      ...prev,
      sections: [...prev.sections, duplicated],
    }));
  }, [pageData.sections.length]);

  // Save page
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(pageData);
      } else {
        const url = pageId ? `/api/cms/pages/${pageId}` : '/api/cms/pages';
        const method = pageId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageData),
        });

        if (!response.ok) {
          throw new Error('Failed to save page');
        }

        const result = await response.json();
        if (!pageId && result.data?.id) {
          router.push(`/super-admin/cms/pages/${result.data.id}/edit`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {pageId ? 'Edit Page' : 'Create New Page'}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              pageData.status === 'published' ? 'bg-green-100 text-green-800' :
              pageData.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              pageData.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
              pageData.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {pageData.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Page Settings
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Page'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4 border-b">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Content
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </div>
          </button>
        </div>
      </div>

      {/* Page Metadata Panel */}
      {showMetadata && (
        <div className="bg-white border-b px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Title
              </label>
              <input
                type="text"
                value={pageData.title}
                onChange={(e) => setPageData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter page title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={pageData.slug}
                onChange={(e) => setPageData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="page-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={pageData.metaTitle}
                onChange={(e) => setPageData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="SEO title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <input
                type="text"
                value={pageData.metaDescription}
                onChange={(e) => setPageData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="SEO description"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'content' && (
          <div className="h-full flex">
            {/* Sections List */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Template Selector */}
              {showTemplateSelector && (
                <div className="bg-white rounded-lg border p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 text-left"
                      >
                        {template.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        )}
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600">{template.category}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTemplateSelector(false)}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Skip and start from scratch
                  </button>
                </div>
              )}

              {/* Sections */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Page Sections</h3>
                  <button
                    onClick={handleAddSection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>

                {pageData.sections.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No sections yet. Add your first section to get started.</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pageData.sections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageData.sections.map((section) => (
                        <SortableSection
                          key={section.id}
                          section={section}
                          onEdit={handleEditSection}
                          onDelete={handleDeleteSection}
                          onToggleVisibility={handleToggleVisibility}
                          onDuplicate={handleDuplicateSection}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Section Editor Panel */}
            {showSectionForm && editingSection && (
              <div className="w-96 border-l bg-white overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Section</h3>
                    <button
                      onClick={() => {
                        setShowSectionForm(false);
                        setEditingSection(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editingSection.title}
                        onChange={(e) =>
                          setEditingSection((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section Type
                      </label>
                      <select
                        value={editingSection.sectionType}
                        onChange={(e) =>
                          setEditingSection((prev) =>
                            prev ? { ...prev, sectionType: e.target.value } : null
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="hero">Hero</option>
                        <option value="content">Content</option>
                        <option value="features">Features</option>
                        <option value="gallery">Gallery</option>
                        <option value="testimonials">Testimonials</option>
                        <option value="cta">Call to Action</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content (JSON)
                      </label>
                      <textarea
                        value={JSON.stringify(editingSection.content, null, 2)}
                        onChange={(e) => {
                          try {
                            const content = JSON.parse(e.target.value);
                            setEditingSection((prev) =>
                              prev ? { ...prev, content } : null
                            );
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                        rows={10}
                      />
                    </div>

                    <button
                      onClick={() => editingSection && handleSaveSection(editingSection)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Section
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="bg-white rounded-lg border p-6 max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Page Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={pageData.status}
                    onChange={(e) =>
                      setPageData((prev) => ({
                        ...prev,
                        status: e.target.value as PageData['status'],
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={pageData.templateId || ''}
                    onChange={(e) =>
                      setPageData((prev) => ({
                        ...prev,
                        templateId: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">No Template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-6">
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-4">{pageData.title || 'Untitled Page'}</h3>
                
                {pageData.sections
                  .filter((s) => s.isVisible)
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div key={section.id} className="mb-8 p-6 border rounded-lg">
                      <h4 className="text-xl font-semibold mb-4">{section.title}</h4>
                      <div className="text-sm text-gray-600 mb-2">Type: {section.sectionType}</div>
                      <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(section.content, null, 2)}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
