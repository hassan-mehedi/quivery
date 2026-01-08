import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NeonTask - TODO & Notes',
  description: 'A modern TODO and Notes application with neon aesthetics',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NeonTask',
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
        </SessionProvider>
      </body>
    </html>
  );
}
