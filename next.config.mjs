/** @type {import("next").NextConfig} */
const nextConfig = {
  // Next.js 14.2 doesn't support reactCompiler option
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'maplibre-gl'
    };
    return config;
  }
};

export default nextConfig;
