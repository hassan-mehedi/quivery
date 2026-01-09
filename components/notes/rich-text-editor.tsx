'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter,
  List,
  ListOrdered,
  ListTodo,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const MenuButton = ({
    onClick,
    active,
    disabled,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0 text-foreground',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('border-0 bg-transparent', className)}>
      <div className="border-b border-border bg-card/50 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <Code className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
        >
          <Highlighter className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
        >
          <ListTodo className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
        </MenuButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
