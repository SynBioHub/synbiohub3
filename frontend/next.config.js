// Next.config.js
module.exports = {
  env: {
    test: process.env.test
  },
  images: {
    domains: ['localhost'],
  },
  publicRuntimeConfig: {
    backend: process.env.backend
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/status',
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://localhost:7777/:path*', // Proxy to Backend
      },
    ];
  },
};
