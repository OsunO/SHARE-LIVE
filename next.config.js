/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
}

module.exports = nextConfig
