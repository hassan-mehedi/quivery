'use client';

import { Editor } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function JsonCodeEditor({ value, onChange, readOnly = false }: JsonCodeEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="json"
      value={value}
      onChange={(newValue) => onChange(newValue || '')}
      theme="vs-dark"
      loading={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
      }}
    />
  );
}
