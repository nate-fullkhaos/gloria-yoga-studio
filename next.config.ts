import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/home.html' },
        { source: '/about', destination: '/about.html' },
        { source: '/programs', destination: '/programs.html' },
        { source: '/studio', destination: '/studio.html' },
        { source: '/contact', destination: '/contact.html' },
        { source: '/schedule', destination: '/schedule.html' },
      ],
    }
  },
}

export default nextConfig
