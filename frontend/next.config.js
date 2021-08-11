// Next.config.js
module.exports = {
   env: {
     backendUrl: process.env.backendUrl
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