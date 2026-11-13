/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  // Lets a phone on the same Wi-Fi open the dev server without Next.js
  // blocking its /_next/* requests. Production export ignores this.
  allowedDevOrigins: ["192.168.31.*"],

  // InfinityFree serves plain static files, so the frontend is exported
  // as a fully client-rendered bundle into `out/` by `npm run build`.
  output: "export",
  trailingSlash: true,

  // Next's image optimizer needs a Node.js server. Static hosting must use
  // the original image URLs instead.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
