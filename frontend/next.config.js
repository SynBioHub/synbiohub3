// Next.config.js
module.exports = {
  env: {
    backendUrl: process.env.backendUrl,
    backendUrlSS: process.env.backendUrlSS,
    test: process.env.test
  },
  publicRuntimeConfig: {
    backend: process.env.backend,
    backendSS: process.env.backendSS
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/status',
        permanent: true
      }
    ];
  }
};
