// Next.config.js
module.exports = {
   env: {
     backendUrl: process.env.backendUrl,
   },
   publicRuntimeConfig: {
     backend: process.env.backend
   },
   async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/status',
        permanent: true,
      },
    ]
  },
};