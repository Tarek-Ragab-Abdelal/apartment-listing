/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'utils', 'components', 'lib', 'src'],
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Compression (gzip/brotli automatically enabled by Vercel/hosting providers)
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Bundle splitting for better caching
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        ui: {
          name: 'ui-components',
          chunks: 'all',
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          priority: 30,
          reuseExistingChunk: true,
        },
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          priority: 20,
          reuseExistingChunk: true,
        },
      };
    }
    
    return config;
  },
};

// Only use bundle analyzer if explicitly enabled and the module is available
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    module.exports = withBundleAnalyzer(nextConfig);
  } catch (e) {
    console.warn('Bundle analyzer not available, proceeding without it');
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}