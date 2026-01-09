'use client';

import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { Tag } from '@prisma/client';
import { TagBadge } from './tag-badge';
import { TagSelector } from './tag-selector';
import { Button } from '@/components/ui/button';

interface NotesFilterBarProps {
  selectedTagIds: string[];
  allTags: Tag[];
  onToggleTag: (tagId: string) => void;
  onClearAll: () => void;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
}

export function NotesFilterBar({
  selectedTagIds,
  allTags,
  onToggleTag,
  onClearAll,
  onCreateTag,
}: NotesFilterBarProps) {
  const [showAll, setShowAll] = useState(false);

  if (selectedTagIds.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3">
        <TagSelector
          tags={allTags}
          selectedTagIds={selectedTagIds}
          onToggleTag={onToggleTag}
          onCreateTag={async (name, color) => {
            const newTag = await onCreateTag(name, color);
            onToggleTag(newTag.id);
          }}
        >
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </TagSelector>
      </div>
    );
  }

  const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id));
  const displayedTags = showAll ? selectedTags : selectedTags.slice(0, 3);
  const remainingCount = selectedTags.length - 3;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-sm text-muted-foreground">Filters:</span>

      {displayedTags.map(tag => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onToggleTag(tag.id)}
          className="group inline-flex items-center gap-1.5 transition-all hover:scale-105"
        >
          <TagBadge tag={tag} />
          <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
        </button>
      ))}

      {!showAll && remainingCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
        >
          +{remainingCount} more
        </button>
      )}

      {showAll && remainingCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
        >
          Show less
        </button>
      )}

      <TagSelector
        tags={allTags}
        selectedTagIds={selectedTagIds}
        onToggleTag={onToggleTag}
        onCreateTag={async (name, color) => {
          const newTag = await onCreateTag(name, color);
          onToggleTag(newTag.id);
        }}
      >
        <Button variant="ghost" size="sm" className="h-7">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </TagSelector>

      <button
        type="button"
        onClick={onClearAll}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent flex items-center gap-1"
      >
        <X className="h-3 w-3" />
        Clear
      </button>
    </div>
  );
}
