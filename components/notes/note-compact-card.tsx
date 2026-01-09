'use client';

import { Note, Tag } from '@prisma/client';
import { TagBadge } from './tag-badge';
import { formatDistanceToNow } from 'date-fns';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface NoteCompactCardProps {
  note: NoteWithTags;
  selected: boolean;
  onClick: () => void;
}

export function NoteCompactCard({ note, selected, onClick }: NoteCompactCardProps) {
  const displayedTags = note.tags.slice(0, 2);
  const remainingCount = note.tags.length - 2;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative w-full max-w-3xl mx-auto px-4 py-2
        flex items-center justify-between gap-3
        bg-card/50 backdrop-blur-sm
        border border-border/50
        rounded-lg
        transition-all duration-200
        hover:bg-card/80 hover:border-border
        text-left
        min-h-[48px]
        ${selected ? 'ring-2 ring-primary/50 border-primary/70' : ''}
      `}
    >
      {/* Left side: Title */}
      <h3 className="text-sm font-medium line-clamp-1 flex-1">{note.title || 'Untitled'}</h3>

      {/* Right side: Tags and Date */}
      <div className="flex items-center gap-3">
        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            {displayedTags.map(({ tag }) => (
              <TagBadge key={tag.id} tag={tag} size="sm" />
            ))}
            {remainingCount > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        {/* Date */}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
