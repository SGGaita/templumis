/** @type {import('next').NextConfig} */
const backendInternal =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendInternal}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
