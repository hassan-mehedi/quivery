'use client';

import { Note, Tag } from '@prisma/client';
import { TagBadge } from './tag-badge';
import { formatDistanceToNow } from 'date-fns';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface NoteListCardProps {
  note: NoteWithTags;
  selected: boolean;
  onClick: () => void;
}

export function NoteListCard({ note, selected, onClick }: NoteListCardProps) {
  // Strip HTML and get plain text preview
  const getPreview = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.trim() || 'Empty note';
  };

  const preview = getPreview(note.content);
  const displayedTags = note.tags.slice(0, 3);
  const remainingCount = note.tags.length - 3;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative w-full max-w-2xl mx-auto p-4
        flex flex-col
        bg-card/50 backdrop-blur-sm
        border border-border/50
        rounded-lg
        transition-all duration-200
        hover:bg-card/80 hover:border-border
        text-left
        ${selected ? 'ring-2 ring-primary/50 border-primary/70' : ''}
      `}
    >
      {/* Title & Metadata Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-medium text-foreground line-clamp-1 flex-1">
          {note.title || 'Untitled'}
        </h3>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </div>

      {/* Content preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{preview}</p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {displayedTags.map(({ tag }) => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
          {remainingCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              +{remainingCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
