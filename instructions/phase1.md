# Phase 1: Project Setup and Infrastructure

## Objective
Set up the foundational infrastructure including Prisma with Neon PostgreSQL, Zustand store configuration, PWA support, and Shadcn UI with custom dark neon theme.

## Prerequisites
- Existing Next.js project with TypeScript, Tailwind CSS, ESLint
- Neon PostgreSQL database connection string

---

## Task 1.1: Install Dependencies

Install all required dependencies:

```bash
# Core dependencies
npm install @prisma/client zustand next-auth @auth/prisma-adapter bcryptjs
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-highlight @tiptap/extension-task-list @tiptap/extension-task-item
npm install next-pwa
npm install clsx tailwind-merge class-variance-authority lucide-react

# Dev dependencies
npm install -D prisma @types/bcryptjs
```

---

## Task 1.2: Initialize Shadcn UI

Initialize Shadcn UI with the following configuration:

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

After initialization, install these components:

```bash
npx shadcn@latest add button input label card dialog dropdown-menu avatar badge checkbox select textarea tabs toast sonner sheet sidebar separator scroll-area
```

---

## Task 1.3: Configure Custom Neon Dark Theme

Replace the default Shadcn theme variables in `app/globals.css` with a custom neon dark theme:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: oklch(0.12 0.01 260);
  --color-foreground: oklch(0.95 0.01 260);
  --color-card: oklch(0.14 0.015 260);
  --color-card-foreground: oklch(0.95 0.01 260);
  --color-popover: oklch(0.14 0.015 260);
  --color-popover-foreground: oklch(0.95 0.01 260);
  --color-primary: oklch(0.75 0.18 180);
  --color-primary-foreground: oklch(0.12 0.01 260);
  --color-secondary: oklch(0.22 0.02 260);
  --color-secondary-foreground: oklch(0.95 0.01 260);
  --color-muted: oklch(0.2 0.015 260);
  --color-muted-foreground: oklch(0.65 0.02 260);
  --color-accent: oklch(0.7 0.2 320);
  --color-accent-foreground: oklch(0.12 0.01 260);
  --color-destructive: oklch(0.6 0.22 25);
  --color-destructive-foreground: oklch(0.98 0.01 260);
  --color-border: oklch(0.28 0.025 260);
  --color-input: oklch(0.22 0.02 260);
  --color-ring: oklch(0.75 0.18 180);
  
  /* Neon glow colors */
  --color-neon-cyan: oklch(0.8 0.2 195);
  --color-neon-pink: oklch(0.75 0.22 330);
  --color-neon-purple: oklch(0.7 0.2 290);
  --color-neon-green: oklch(0.8 0.22 145);
  
  /* Sidebar specific */
  --color-sidebar: oklch(0.1 0.01 260);
  --color-sidebar-foreground: oklch(0.9 0.01 260);
  --color-sidebar-primary: oklch(0.75 0.18 180);
  --color-sidebar-primary-foreground: oklch(0.12 0.01 260);
  --color-sidebar-accent: oklch(0.18 0.02 260);
  --color-sidebar-accent-foreground: oklch(0.95 0.01 260);
  --color-sidebar-border: oklch(0.25 0.02 260);
  --color-sidebar-ring: oklch(0.75 0.18 180);
  
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

/* Neon glow utilities */
.neon-glow-cyan {
  box-shadow: 0 0 5px oklch(0.8 0.2 195 / 0.5),
              0 0 20px oklch(0.8 0.2 195 / 0.3),
              0 0 40px oklch(0.8 0.2 195 / 0.1);
}

.neon-glow-pink {
  box-shadow: 0 0 5px oklch(0.75 0.22 330 / 0.5),
              0 0 20px oklch(0.75 0.22 330 / 0.3),
              0 0 40px oklch(0.75 0.22 330 / 0.1);
}

.neon-glow-purple {
  box-shadow: 0 0 5px oklch(0.7 0.2 290 / 0.5),
              0 0 20px oklch(0.7 0.2 290 / 0.3),
              0 0 40px oklch(0.7 0.2 290 / 0.1);
}

.neon-text-glow {
  text-shadow: 0 0 10px currentColor,
               0 0 20px currentColor,
               0 0 40px currentColor;
}

/* Focus states with neon effect */
.focus-neon:focus {
  outline: none;
  box-shadow: 0 0 0 2px oklch(0.12 0.01 260),
              0 0 0 4px oklch(0.75 0.18 180),
              0 0 15px oklch(0.75 0.18 180 / 0.5);
}

/* Subtle background gradients */
.bg-gradient-dark {
  background: linear-gradient(
    135deg,
    oklch(0.12 0.01 260) 0%,
    oklch(0.1 0.02 280) 50%,
    oklch(0.12 0.01 260) 100%
  );
}
```

---

## Task 1.4: Set Up Prisma with Neon

1. Initialize Prisma:

```bash
npx prisma init
```

2. Update `.env` with your Neon connection string:

```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. Create the Prisma schema in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  todos         Todo[]
  notes         Note[]
  tags          Tag[]
}

model Todo {
  id          String      @id @default(cuid())
  title       String
  description String?
  status      TodoStatus  @default(PENDING)
  priority    Priority    @default(MEDIUM)
  dueDate     DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@index([priority])
}

model Note {
  id          String    @id @default(cuid())
  title       String
  content     String    @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tags        NoteTag[]
  
  @@index([userId])
}

model Tag {
  id          String    @id @default(cuid())
  name        String
  color       String    @default("#8B5CF6")
  createdAt   DateTime  @default(now())
  
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  notes       NoteTag[]
  
  @@unique([name, userId])
  @@index([userId])
}

model NoteTag {
  noteId      String
  tagId       String
  
  note        Note      @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([noteId, tagId])
}

enum TodoStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

4. Create Prisma client utility in `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

5. Push the schema to Neon:

```bash
npx prisma db push
npx prisma generate
```

---

## Task 1.5: Configure NextAuth.js

1. Create auth configuration in `lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signUp: "/register"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
}
```

2. Create auth types in `types/next-auth.d.ts`:

```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
```

3. Create API route in `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

4. Create registration API in `app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
```

---

## Task 1.6: Set Up Zustand Stores

1. Create the Todo store in `stores/todo-store.ts`:

```typescript
import { create } from 'zustand'
import { Todo, TodoStatus, Priority } from '@prisma/client'

interface TodoState {
  todos: Todo[]
  isLoading: boolean
  error: string | null
  filter: {
    status: TodoStatus | 'ALL'
    priority: Priority | 'ALL'
  }
  setTodos: (todos: Todo[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  setFilter: (filter: Partial<TodoState['filter']>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  isLoading: false,
  error: null,
  filter: {
    status: 'ALL',
    priority: 'ALL'
  },
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),
  updateTodo: (id, updates) => set((state) => ({
    todos: state.todos.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  deleteTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id)
  })),
  setFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter }
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))
```

2. Create the Note store in `stores/note-store.ts`:

```typescript
import { create } from 'zustand'
import { Note, Tag } from '@prisma/client'

type NoteWithTags = Note & {
  tags: { tag: Tag }[]
}

interface NoteState {
  notes: NoteWithTags[]
  tags: Tag[]
  selectedNote: NoteWithTags | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  selectedTagIds: string[]
  setNotes: (notes: NoteWithTags[]) => void
  setTags: (tags: Tag[]) => void
  addNote: (note: NoteWithTags) => void
  updateNote: (id: string, updates: Partial<NoteWithTags>) => void
  deleteNote: (id: string) => void
  selectNote: (note: NoteWithTags | null) => void
  addTag: (tag: Tag) => void
  deleteTag: (id: string) => void
  setSearchQuery: (query: string) => void
  setSelectedTagIds: (tagIds: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  tags: [],
  selectedNote: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedTagIds: [],
  setNotes: (notes) => set({ notes }),
  setTags: (tags) => set({ tags }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n),
    selectedNote: state.selectedNote?.id === id 
      ? { ...state.selectedNote, ...updates } 
      : state.selectedNote
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
    selectedNote: state.selectedNote?.id === id ? null : state.selectedNote
  })),
  selectNote: (note) => set({ selectedNote: note }),
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  deleteTag: (id) => set((state) => ({
    tags: state.tags.filter((t) => t.id !== id)
  })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTagIds: (selectedTagIds) => set({ selectedTagIds }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))
```

3. Create UI store in `stores/ui-store.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type View = 'todos' | 'notes'

interface UIState {
  currentView: View
  sidebarOpen: boolean
  isMobile: boolean
  setCurrentView: (view: View) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsMobile: (isMobile: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentView: 'todos',
      sidebarOpen: true,
      isMobile: false,
      setCurrentView: (currentView) => set({ currentView }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setIsMobile: (isMobile) => set({ isMobile })
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ currentView: state.currentView })
    }
  )
)
```

---

## Task 1.7: Configure PWA Support

1. Create `next.config.ts`:

```typescript
import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  reactStrictMode: true
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

export default pwaConfig(nextConfig)
```

2. Create `public/manifest.json`:

```json
{
  "name": "NeonTask - TODO & Notes",
  "short_name": "NeonTask",
  "description": "A modern TODO and Notes application with neon aesthetics",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#06b6d4",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

3. Add metadata to `app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'NeonTask - TODO & Notes',
  description: 'A modern TODO and Notes application with neon aesthetics',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NeonTask'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#06b6d4'
}
```

4. Create placeholder icons directory and add note to generate icons:

```bash
mkdir -p public/icons
# Note: Generate icons using a tool like https://realfavicongenerator.net/
# or create simple placeholder icons with your logo
```

---

## Task 1.8: Create Session Provider

Create `components/providers/session-provider.tsx`:

```typescript
"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
```

---

## Task 1.9: Create Utility Functions

Create `lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffInMs = now.getTime() - then.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return formatDate(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}
```

---

## Verification Checklist

After completing this phase, verify:

- [ ] All dependencies installed without errors
- [ ] Shadcn UI components available
- [ ] Custom neon theme applied (dark background, glow effects)
- [ ] Prisma schema pushed to Neon successfully
- [ ] `npx prisma studio` shows all tables
- [ ] NextAuth configuration complete
- [ ] Registration API endpoint works
- [ ] Zustand stores created
- [ ] PWA manifest configured
- [ ] No TypeScript errors

---

## Next Phase Preview

Phase 2 will cover:
- Authentication pages (Login/Register)
- Protected route middleware
- Main layout with responsive sidebar
- Navigation component with neon styling
