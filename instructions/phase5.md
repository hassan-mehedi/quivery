# Phase 5: PWA Optimization and Docker Deployment

## Objective

Finalize PWA configuration with proper icons and caching, create Docker configuration for Dokploy deployment, optimize production build, and perform final testing.

## Prerequisites

- Phases 1-4 completed
- All features working locally
- Neon database connection working

---

## Task 5.1: Generate PWA Icons

Create a script to generate PWA icons. First, create a base icon (512x512 PNG) with your app logo.

Create `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(inputImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate favicon
  await sharp(inputImage)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.ico'));

  console.log('Generated favicon.ico');

  // Generate Apple touch icon
  await sharp(inputImage)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));

  console.log('Generated apple-touch-icon.png');
}

generateIcons().catch(console.error);
```

Install sharp and run:

```bash
npm install -D sharp
node scripts/generate-icons.js
```

Alternatively, create a simple SVG logo and convert manually, or use an online tool.

---

## Task 5.2: Create Base Logo

Create `public/logo.png` - A 512x512 PNG with your app icon. Here's a simple approach using a placeholder:

Create `public/logo.svg`:

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(128, 128)" filter="url(#glow)">
    <path d="M128 0L256 64V192L128 256L0 192V64L128 0Z" fill="none" stroke="#06B6D4" stroke-width="8"/>
    <path d="M128 48L80 72V168L128 192L176 168V72L128 48Z" fill="#06B6D4" opacity="0.3"/>
    <circle cx="128" cy="120" r="32" fill="#EC4899"/>
  </g>
</svg>
```

Convert to PNG using an online converter or Inkscape.

---

## Task 5.3: Update PWA Manifest

Update `public/manifest.json`:

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
  "categories": ["productivity", "utilities"],
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
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "New Todo",
      "short_name": "Todo",
      "url": "/?action=new-todo",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "New Note",
      "short_name": "Note",
      "url": "/?action=new-note",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## Task 5.4: Configure next-pwa for Caching

Update `next.config.ts`:

```typescript
import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\.(?:css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\/_next\/static.+\.js$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-js',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60, // 1 minute
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

export default withPWA(nextConfig);
```

---

## Task 5.5: Add Offline Indicator Component

Create `components/ui/offline-indicator.tsx`:

```typescript
"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Check initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
      "flex items-center gap-2 px-4 py-2 rounded-full",
      "bg-yellow-500/20 border border-yellow-500/50 text-yellow-400",
      "animate-in slide-in-from-bottom-4 duration-300"
    )}>
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">You&apos;re offline</span>
    </div>
  )
}
```

Add to `app/layout.tsx`:

```typescript
import { OfflineIndicator } from "@/components/ui/offline-indicator"

// Inside the body
<OfflineIndicator />
```

---

## Task 5.6: Create Dockerfile

Create `Dockerfile`:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## Task 5.7: Create Docker Compose for Local Testing

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
```

---

## Task 5.8: Create .dockerignore

Create `.dockerignore`:

```
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next
out

# Production
build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea
.vscode

# Git
.git
.gitignore

# Documentation
README.md
docs

# Scripts
scripts
```

---

## Task 5.9: Create Production Environment Template

Create `.env.example`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx.region.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Optional: Analytics, etc.
```

---

## Task 5.10: Add Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      },
      { status: 503 }
    );
  }
}
```

---

## Task 5.11: Update Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "docker:build": "docker build -t neontask .",
    "docker:run": "docker run -p 3000:3000 --env-file .env neontask"
  }
}
```

---

## Task 5.12: Create Dokploy Configuration

For Dokploy deployment, you'll need to:

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. In Dokploy:
   - Create a new service
   - Connect your Git repository
   - Select "Docker" as build type
   - Configure environment variables:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`

3. Configure health check:
   - Path: `/api/health`
   - Interval: 30s
   - Timeout: 10s

4. Set resource limits (recommended):
   - CPU: 0.5-1 core
   - Memory: 512MB-1GB

---

## Task 5.13: Pre-deployment Checklist

Run these checks before deploying:

```bash
# 1. Lint check
npm run lint

# 2. Build check
npm run build

# 3. Prisma check
npx prisma validate

# 4. Test Docker build locally
npm run docker:build

# 5. Test Docker run locally
npm run docker:run
```

---

## Task 5.14: Add Meta Tags for Better PWA Experience

Update `app/layout.tsx` metadata:

```typescript
export const metadata: Metadata = {
  title: {
    default: 'NeonTask - TODO & Notes',
    template: '%s | NeonTask',
  },
  description: 'A modern TODO and Notes application with neon aesthetics',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NeonTask',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'NeonTask',
    title: 'NeonTask - TODO & Notes',
    description: 'A modern TODO and Notes application with neon aesthetics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeonTask - TODO & Notes',
    description: 'A modern TODO and Notes application with neon aesthetics',
  },
};
```

---

## Verification Checklist

After completing this phase, verify:

- [ ] PWA icons generated in all sizes
- [ ] Manifest.json properly configured
- [ ] App installable on mobile/desktop
- [ ] Offline indicator appears when offline
- [ ] Cached resources load offline
- [ ] Docker build completes successfully
- [ ] Docker container runs locally
- [ ] Health endpoint returns healthy
- [ ] Environment variables properly configured
- [ ] Lint passes with no errors
- [ ] Build completes without errors
- [ ] Deployed to Dokploy successfully
- [ ] HTTPS working on production
- [ ] All features work in production

---

## Post-Deployment Tasks

1. **Monitor Performance**
   - Check Core Web Vitals
   - Monitor error rates
   - Track API response times

2. **Set Up Backups**
   - Neon has automatic backups
   - Consider point-in-time recovery

3. **Security Review**
   - Ensure HTTPS only
   - Check CSP headers
   - Review auth flow

4. **User Testing**
   - Test on multiple devices
   - Test PWA installation
   - Test offline functionality

---

## Congratulations!

Your NeonTask application is now complete with:

- ✅ User authentication (email/password)
- ✅ TODO management with status and priority
- ✅ Notes with rich text editing
- ✅ Tag system for notes
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ PWA support with offline capability
- ✅ Docker deployment ready
- ✅ Neon PostgreSQL database
- ✅ Modern neon dark theme
