import type { NextConfig } from 'next';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to acknowledge Turbopack usage
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default pwaConfig(nextConfig);
