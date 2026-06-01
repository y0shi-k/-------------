import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src",
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "http://127.0.0.1:*",
    "http://localhost:*",
    "ws://127.0.0.1:*",
    "ws://localhost:*"
  ].join(" "),
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:"
];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; ")
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
