# Phase 2: Authentication and Layout

## Objective
Create authentication pages (login/register), protected route middleware, and the main application layout with a responsive sidebar featuring neon styling.

## Prerequisites
- Phase 1 completed
- Prisma schema deployed
- NextAuth configured

---

## Task 2.1: Create Auth Middleware

Create `middleware.ts` in the project root:

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow auth pages when not logged in
        if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
          return true
        }
        
        // Allow API auth routes
        if (pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Require auth for everything else
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'
  ]
}
```

---

## Task 2.2: Create Login Page

Create `app/login/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-neon-cyan/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md relative bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-2 neon-glow-cyan">
            <Zap className="w-6 h-6 text-neon-cyan" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your NeonTask account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="focus-neon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="focus-neon"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full neon-glow-cyan" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link 
                href="/register" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

---

## Task 2.3: Create Register Page

Create `app/register/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-64 h-64 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-neon-green/10 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md relative bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-2 neon-glow-purple">
            <Zap className="w-6 h-6 text-neon-purple" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join NeonTask and boost your productivity</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="focus-neon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="focus-neon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="focus-neon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="focus-neon"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full neon-glow-purple" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

---

## Task 2.4: Create App Sidebar Component

Create `components/layout/app-sidebar.tsx`:

```typescript
"use client"

import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { 
  CheckSquare, 
  FileText, 
  LogOut, 
  Settings,
  ChevronLeft,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUIStore } from "@/stores/ui-store"

const navigation = [
  {
    name: "TODOs",
    view: "todos" as const,
    icon: CheckSquare,
    glowClass: "neon-glow-cyan",
    activeColor: "text-neon-cyan"
  },
  {
    name: "Notes",
    view: "notes" as const,
    icon: FileText,
    glowClass: "neon-glow-pink",
    activeColor: "text-neon-pink"
  }
]

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, isMobile } = useUIStore()

  const handleNavigation = (view: "todos" | "notes") => {
    setCurrentView(view)
    if (isMobile) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16",
          isMobile && !sidebarOpen && "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 transition-opacity duration-200",
            !sidebarOpen && !isMobile && "opacity-0"
          )}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center neon-glow-cyan">
              <Zap className="w-4 h-4 text-neon-cyan" />
            </div>
            <span className="font-bold text-lg">NeonTask</span>
          </div>
          
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 hover:bg-sidebar-accent"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-300",
                !sidebarOpen && "rotate-180"
              )} />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = currentView === item.view
            const Icon = item.icon

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.view)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent group",
                  isActive && "bg-sidebar-accent",
                  isActive && item.glowClass
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? item.activeColor : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className={cn(
                  "font-medium transition-all duration-200",
                  isActive ? item.activeColor : "text-muted-foreground group-hover:text-foreground",
                  !sidebarOpen && !isMobile && "opacity-0 w-0"
                )}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User section */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                "hover:bg-sidebar-accent"
              )}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "flex-1 text-left transition-all duration-200 overflow-hidden",
                  !sidebarOpen && !isMobile && "opacity-0 w-0"
                )}>
                  <p className="text-sm font-medium truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
```

---

## Task 2.5: Create Mobile Header Component

Create `components/layout/mobile-header.tsx`:

```typescript
"use client"

import { Menu, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui-store"

export function MobileHeader() {
  const { toggleSidebar, isMobile } = useUIStore()

  if (!isMobile) return null

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center neon-glow-cyan">
          <Zap className="w-3.5 h-3.5 text-neon-cyan" />
        </div>
        <span className="font-bold">NeonTask</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  )
}
```

---

## Task 2.6: Create Main Layout Component

Create `components/layout/main-layout.tsx`:

```typescript
"use client"

import { useEffect } from "react"
import { useUIStore } from "@/stores/ui-store"
import { AppSidebar } from "./app-sidebar"
import { MobileHeader } from "./mobile-header"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, isMobile, setIsMobile, setSidebarOpen } = useUIStore()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [setIsMobile, setSidebarOpen])

  return (
    <div className="min-h-screen bg-gradient-dark">
      <AppSidebar />
      <MobileHeader />
      
      <main
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          isMobile ? "pt-14" : sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

---

## Task 2.7: Update Root Layout

Update `app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster position="bottom-right" />
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

## Task 2.8: Create Dashboard Page Shell

Update `app/page.tsx`:

```typescript
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { MainLayout } from "@/components/layout/main-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  )
}
```

Create `components/dashboard/dashboard-content.tsx`:

```typescript
"use client"

import { useUIStore } from "@/stores/ui-store"
import { TodoView } from "@/components/todos/todo-view"
import { NotesView } from "@/components/notes/notes-view"

export function DashboardContent() {
  const { currentView } = useUIStore()

  return (
    <div className="space-y-6">
      {currentView === "todos" ? <TodoView /> : <NotesView />}
    </div>
  )
}
```

Create placeholder components:

`components/todos/todo-view.tsx`:
```typescript
export function TodoView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">TODOs</h1>
      <p className="text-muted-foreground">Todo view will be implemented in Phase 3</p>
    </div>
  )
}
```

`components/notes/notes-view.tsx`:
```typescript
export function NotesView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notes</h1>
      <p className="text-muted-foreground">Notes view will be implemented in Phase 4</p>
    </div>
  )
}
```

---

## Verification Checklist

After completing this phase, verify:

- [ ] Unauthenticated users redirected to `/login`
- [ ] Login page renders with neon styling
- [ ] Registration creates user in database
- [ ] Login authenticates and redirects to dashboard
- [ ] Sidebar shows/hides correctly
- [ ] Sidebar collapses on desktop
- [ ] Mobile menu works (hamburger icon)
- [ ] Mobile overlay appears when sidebar is open
- [ ] Navigation between TODOs and Notes works
- [ ] User dropdown shows email and logout option
- [ ] Logout redirects to login page
- [ ] Responsive behavior works (mobile, tablet, desktop)

---

## Next Phase Preview

Phase 3 will cover:
- TODO API routes (CRUD operations)
- TODO list component with filtering
- TODO card with status and priority badges
- Add/Edit TODO dialog
- Status and priority management
