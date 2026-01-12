'use client';

import { Note, Tag } from '@prisma/client';
import { TagBadge } from './tag-badge';
import { formatDistanceToNow } from 'date-fns';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface NoteGridCardProps {
  note: NoteWithTags;
  selected: boolean;
  focused?: boolean;
  onClick: () => void;
}

export function NoteGridCard({ note, selected, focused = false, onClick }: NoteGridCardProps) {
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
        group relative w-full min-h-[200px] max-h-[280px] p-4
        flex flex-col
        bg-card/50 backdrop-blur-sm
        border border-border/50
        rounded-lg
        transition-all duration-200
        hover:bg-card/80 hover:border-border hover:scale-[1.01]
        text-left
        ${selected ? 'ring-2 ring-primary/50 border-primary/70' : ''}
        ${focused ? 'ring-2 ring-neon-purple/60 border-neon-purple/50' : ''}
      `}
    >
      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground line-clamp-1 mb-2">
        {note.title || 'Untitled'}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{preview}</p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
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

      {/* Metadata */}
      <div className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </div>
    </button>
  );
}
