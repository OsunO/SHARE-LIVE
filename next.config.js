/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  // 内存优化配置
  experimental: {
    // 禁用 webpack 持久缓存以减少内存使用
    webpackBuildWorker: false,
  },
  webpack: (config, { isServer, nextRuntime }) => {
    // 禁用持久缓存
    config.cache = false;
    return config;
  },
}

module.exports = nextConfig
