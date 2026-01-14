'use client';

import { Note, Tag } from '@prisma/client';
import { formatRelativeDate, truncateText } from '@/lib/utils';
import { TagBadge } from './tag-badge';
import { cn } from '@/lib/utils';

type NoteWithTags = Note & {
  tags: { tag: Tag }[];
};

interface NoteCardProps {
  note: NoteWithTags;
  selected?: boolean;
  focused?: boolean;
  onClick: () => void;
}

export function NoteCard({ note, selected, focused = false, onClick }: NoteCardProps) {
  // Strip HTML tags from content for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const contentPreview = stripHtml(note.content);
  const displayTags = note.tags.slice(0, 3);
  const remainingTagsCount = note.tags.length - 3;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        'hover:bg-accent/80 hover:border-primary/50',
        selected ? 'bg-accent border-primary/70 ring-1 ring-primary/30' : 'bg-card border-border',
        focused && 'ring-2 ring-neon-purple/60 border-neon-purple/50'
      )}
    >
      <div className="space-y-2">
        <h3 className="font-medium text-sm line-clamp-1 text-foreground">{note.title}</h3>

        {contentPreview && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncateText(contentPreview, 100)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {displayTags.map(({ tag }) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {remainingTagsCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                +{remainingTagsCount}
              </span>
            )}
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
