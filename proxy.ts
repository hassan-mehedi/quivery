import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth pages when not logged in
        if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
          return true;
        }

        // Allow API auth routes
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // Require auth for everything else
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
};
