/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─────────────────────────────────────────
  // SECURITY HEADERS
  // Applied to every response from the server
  // ─────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevents clickjacking — no iframes from other origins
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Stops browsers from MIME-sniffing responses
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Controls how much referrer info is sent
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disables browser features you don't need
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Forces HTTPS for 1 year — only enable when on HTTPS hosting
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Prevents XSS via inline scripts from unknown origins
          // Adjust the CSP below to match your actual domains
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
            // Allow Next.js scripts + Google (for Google Auth)
            // Note: 'unsafe-inline' is required for Next.js style hydration.
            // In a future upgrade, consider nonce-based CSP for tighter control.
            "script-src 'self' 'unsafe-inline' https://accounts.google.com",
              // Allow styles from self + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts from Google
              "font-src 'self' https://fonts.gstatic.com",
              // Allow images from self, data URIs, and Unsplash/Pexels (your image sources)
              "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://lh3.googleusercontent.com",
              // Allow media like video/audio from self
              "media-src 'self'",
              // Allow connections to your own API + Google Auth
              "connect-src 'self' https://accounts.google.com",
              // Block all frames
              "frame-src 'none'",
              // Block object embeds
              "object-src 'none'",
              // Block base tag hijacking
              "base-uri 'self'",
              // Force all form submissions to self
              "form-action 'self'",
            ].join("; "),
          },
          // Extra XSS protection for older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Opt out of Google's FLoC/Topics ad tracking
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },

      // ── API routes — extra cache control ──
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },

  // ─────────────────────────────────────────
  // IMAGE DOMAINS
  // Whitelist only sources you actually use
  // ─────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile pictures
      },
    ],
  },

  // ─────────────────────────────────────────
  // GENERAL HARDENING
  // ─────────────────────────────────────────

  // Hide the X-Powered-By: Next.js header — don't advertise your stack
  poweredByHeader: false,

  // Strict mode catches potential issues early
  reactStrictMode: true,
};

module.exports = nextConfig;