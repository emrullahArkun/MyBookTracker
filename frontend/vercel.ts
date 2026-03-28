const apiOrigin =
  (process.env.API_ORIGIN ?? process.env.VITE_API_URL ?? '').replace(/\/+$/, '');

if (!apiOrigin) {
  throw new Error(
    'Missing API_ORIGIN (or fallback VITE_API_URL) for Vercel external /api rewrite.'
  );
}

export const config = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  git: {
    deploymentEnabled: {
      '*': false,
      main: true,
    },
  },
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${apiOrigin}/api/:path*`,
    },
    {
      source: '/((?!api/).*)',
      destination: '/index.html',
    },
  ],
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '0',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=()',
        },
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https://covers.openlibrary.org https://archive.org data:; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
        },
      ],
    },
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
