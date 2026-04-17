import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@synap/types', '@synap/db'],
}

export default nextConfig
