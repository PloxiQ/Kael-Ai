/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

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
