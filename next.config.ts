import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/programs.html', destination: '/programs', permanent: true },
      { source: '/studio.html', destination: '/studio', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/schedule.html', destination: '/schedule', permanent: true },
    ]
  },
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
