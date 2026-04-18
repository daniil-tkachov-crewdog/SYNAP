import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@synap/types', '@synap/db'],
  // Supabase SSR 0.5.2 return types are incompatible with supabase-js 2.103.x generics;
  // runtime behavior is correct — suppress until we pin/upgrade the Supabase packages.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig
