'use client';

import { useState, useMemo, useEffect } from 'react';
import { Tag } from '@prisma/client';
import { TagBadge } from './tag-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Tag as TagIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  trigger?: React.ReactNode;
}

const TAG_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#F97316', // Orange
];

export function TagPicker({ selectedTagIds, onChange, trigger }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  // Fetch tags
  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open]);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: selectedColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tag');
      }

      const newTag = await response.json();
      setTags([...tags, newTag]);
      onChange([...selectedTagIds, newTag.id]);
      setIsCreating(false);
      setNewTagName('');
      setSelectedColor(TAG_COLORS[0]);
      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Failed to create tag');
    }
  };

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(query));
  }, [tags, searchQuery]);

  const selectedTags = useMemo(() => {
    return tags.filter(t => selectedTagIds.includes(t.id));
  }, [tags, selectedTagIds]);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            <TagIcon className="w-4 h-4 mr-2" />
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTags.slice(0, 3).map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    size="xs"
                    onRemove={() => removeTag(tag.id)}
                  />
                ))}
                {selectedTags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{selectedTags.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              'Select tags'
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Tags</h4>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    size="sm"
                    onRemove={() => removeTag(tag.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {isCreating ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  placeholder="Enter tag name"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createTag()}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'w-6 h-6 rounded border-2 transition-all',
                        selectedColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createTag} size="sm" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Input
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Loading tags...
                    </div>
                  ) : filteredTags.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {searchQuery ? 'No tags found' : 'No tags yet'}
                    </div>
                  ) : (
                    filteredTags.map(tag => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        <TagBadge tag={tag} size="sm" />
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Tag
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
