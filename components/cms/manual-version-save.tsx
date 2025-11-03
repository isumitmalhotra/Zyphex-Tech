/**
 * Manual Version Save Button
 * Allows users to create manual checkpoint versions
 * 
 * Use this before making major changes or as a "save point" feature
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManualVersionSaveProps {
  pageId: string;
  onVersionCreated?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ManualVersionSave({ 
  pageId, 
  onVersionCreated,
  variant = 'outline',
  size = 'default',
}: ManualVersionSaveProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['manual']);

  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeDescription: description || 'Manual checkpoint',
          tags: tags.length > 0 ? tags : ['manual'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Version ${data.data.versionNumber} created successfully`,
        });
        setOpen(false);
        setDescription('');
        setTags(['manual']);
        setTagInput('');
        
        if (onVersionCreated) {
          onVersionCreated();
        }
      } else {
        throw new Error(data.message || 'Failed to create version');
      }
    } catch (error) {
      console.error('Failed to create version:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create version',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Bookmark className="w-4 h-4 mr-2" />
          Save Checkpoint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Manual Checkpoint</DialogTitle>
          <DialogDescription>
            Save the current state of this page as a checkpoint. You can restore to this version later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="e.g., Before redesign, After client approval, Stable version..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Describe what makes this checkpoint special
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Use tags like &quot;checkpoint&quot;, &quot;backup&quot;, &quot;approved&quot;, etc.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">What gets saved?</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Complete page data (title, metadata, settings)</li>
              <li>All sections and their content</li>
              <li>Current timestamp and author</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? 'Saving...' : 'Save Checkpoint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
