// Next.config.js
module.exports = {
   env: {
     backendUrl: process.env.backendUrl,
     testVar: process.env.testVar
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