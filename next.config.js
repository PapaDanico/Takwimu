// Webpack can list the ids of merged duplicate chunks in a different order on each build
// (it depends on parallel compile order), which changes chunk hashes. Sorting the ids makes
// the output byte-identical across builds; the order has no runtime meaning.
class SortChunkIds {
  apply(compiler) {
    compiler.hooks.compilation.tap('SortChunkIds', (compilation) => {
      compilation.hooks.afterOptimizeChunkIds.tap('SortChunkIds', (chunks) => {
        for (const chunk of chunks) {
          if (Array.isArray(chunk.ids) && chunk.ids.length > 1) {
            chunk.ids = [...chunk.ids].sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }));
          }
        }
      });
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // TAKWIMU_DIST: only scripts/test-reviews.js --synthetic sets it, to build a throwaway copy with synthetic rejections.
  distDir: process.env.TAKWIMU_DIST || 'dist',
  images: { unoptimized: true },
  trailingSlash: true,
  webpack(config) {
    config.plugins.push(new SortChunkIds());
    return config;
  },
}
module.exports = nextConfig
