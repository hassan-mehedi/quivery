'use client';

import { useState } from 'react';
import { Plus, Tag as TagIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TagBadge } from './tag-badge';
import { cn } from '@/lib/utils';
import { Tag } from '@prisma/client';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag | void>;
  children?: React.ReactNode;
}

const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
];

export function TagSelector({
  tags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  children,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[7]); // violet default

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setSelectedColor(PRESET_COLORS[7]);
      setIsCreating(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="text-foreground">
            <TagIcon className="h-4 w-4 mr-2" />
            Tags
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-foreground">Tags</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              className="h-7 text-foreground"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {isCreating && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                className="h-8 text-foreground"
              />
              <div className="flex gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all',
                      selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="flex-1 h-7"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                  }}
                  className="flex-1 h-7 text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-60">
          {tags.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tags yet. Create one to get started.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggleTag(tag.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-4 h-4 rounded border',
                      selectedTagIds.includes(tag.id) ? 'bg-primary border-primary' : 'border-input'
                    )}
                  >
                    {selectedTagIds.includes(tag.id) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <TagBadge tag={tag} className="pointer-events-none" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
