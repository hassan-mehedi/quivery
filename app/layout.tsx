import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/sonner';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { PWARegister } from '@/components/pwa-register';
import { WebVitals } from '@/components/web-vitals';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Quivery - All Your Utilities in One Place',
    template: '%s | Quivery',
  },
  description:
    'A comprehensive web app that brings all your essential utilities together in one place',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quivery',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Quivery',
    title: 'Quivery - All Your Utilities in One Place',
    description:
      'A comprehensive web app that brings all your essential utilities together in one place',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quivery - All Your Utilities in One Place',
    description:
      'A comprehensive web app that brings all your essential utilities together in one place',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#06b6d4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster position="bottom-right" />
          <OfflineIndicator />
          <PWARegister />
          <WebVitals />
        </SessionProvider>
      </body>
    </html>
  );
}
