'use client';

import { JsonDocument, JsonSchema } from '@prisma/client';
import { formatRelativeDate, truncateText } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

type JsonDocumentWithSchema = JsonDocument & {
  schema: JsonSchema | null;
};

interface JsonDocumentCardProps {
  document: JsonDocumentWithSchema;
  selected?: boolean;
  focused?: boolean;
  onClick: () => void;
}

export function JsonDocumentCard({ document, selected, focused = false, onClick }: JsonDocumentCardProps) {
  // Get JSON preview (first few lines)
  const getJsonPreview = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const preview = JSON.stringify(parsed, null, 2);
      return preview.split('\n').slice(0, 3).join('\n');
    } catch {
      return content.substring(0, 100);
    }
  };

  const contentPreview = getJsonPreview(document.content);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        'hover:bg-accent/80 hover:border-primary/50 hover:neon-glow-purple',
        selected ? 'bg-accent border-primary/70 ring-1 ring-primary/30' : 'bg-card border-border',
        focused && 'ring-2 ring-neon-purple/60 border-neon-purple/50'
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-1 text-foreground flex-1">
            {document.title}
          </h3>

          {/* Validation status indicator */}
          {document.schemaId && (
            document.isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )
          )}
          {!document.schemaId && (
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 opacity-50" />
          )}
        </div>

        {document.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {truncateText(document.description, 80)}
          </p>
        )}

        {contentPreview && (
          <pre className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/30 p-2 rounded overflow-hidden">
            {contentPreview}
          </pre>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {document.schema && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/30">
                {document.schema.name}
              </Badge>
            )}
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeDate(document.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
