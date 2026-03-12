/**
 * 图片 URL 处理工具
 * 支持 MinIO 缩略图、Cloudinary 优化、本地图片处理
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original'

interface ImageDimensions {
  width: number
  height: number
  quality: number
}

const sizeMap: Record<ImageSize, ImageDimensions> = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 90 },
  large: { width: 1200, height: 1200, quality: 90 },
  original: { width: 0, height: 0, quality: 95 }
}

/**
 * 获取优化后的图片 URL
 * 
 * 支持的优化方式：
 * 1. MinIO: 通过查询参数添加尺寸 (需要 MinIO 配合图片处理服务)
 * 2. Cloudinary: 使用其自动优化 URL
 * 3. 本地图片: 返回原图 (由 Next.js Image 组件处理)
 */
export function getOptimizedImageUrl(
  url: string,
  size: ImageSize = 'medium',
  options?: {
    format?: 'webp' | 'jpeg' | 'png' | 'auto'
    fit?: 'cover' | 'contain' | 'fill'
  }
): string {
  if (!url) return ''
  
  const dimensions = sizeMap[size]
  const { format = 'auto', fit = 'cover' } = options || {}
  
  // Cloudinary 图片优化
  if (url.includes('cloudinary.com')) {
    return getCloudinaryOptimizedUrl(url, dimensions, format, fit)
  }
  
  // MinIO 图片优化 (通过查询参数)
  if (isMinIOUrl(url)) {
    return getMinIOOptimizedUrl(url, dimensions, format, fit)
  }
  
  // 本地图片 - 返回原图，由 Next.js Image 组件处理
  return url
}

/**
 * 判断是否为 MinIO URL
 */
function isMinIOUrl(url: string): boolean {
  const minioEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || '101.34.245.133'
  return url.includes(minioEndpoint) || url.includes(':9000')
}

/**
 * MinIO 图片优化
 * 通过添加查询参数请求不同尺寸
 * 注意：需要 MinIO 配合图片处理服务 (如 Thumbor 或 imgproxy)
 */
function getMinIOOptimizedUrl(
  url: string,
  dimensions: ImageDimensions,
  format: string,
  fit: string
): string {
  if (dimensions.width === 0) return url
  
  const params = new URLSearchParams()
  params.set('w', dimensions.width.toString())
  params.set('h', dimensions.height.toString())
  params.set('q', dimensions.quality.toString())
  params.set('fit', fit)
  
  if (format !== 'auto') {
    params.set('f', format)
  }
  
  // 检查 URL 是否已有查询参数
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

/**
 * Cloudinary 图片优化
 */
function getCloudinaryOptimizedUrl(
  url: string,
  dimensions: ImageDimensions,
  format: string,
  fit: string
): string {
  // Cloudinary URL 格式: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{path}
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url
  
  const baseUrl = url.slice(0, uploadIndex + 8) // includes '/upload/'
  const imagePath = url.slice(uploadIndex + 8)
  
  // 构建转换参数
  const transformations: string[] = []
  
  if (dimensions.width > 0) {
    transformations.push(`w_${dimensions.width}`)
  }
  if (dimensions.height > 0) {
    transformations.push(`h_${dimensions.height}`)
  }
  if (dimensions.quality > 0 && dimensions.quality < 100) {
    transformations.push(`q_${dimensions.quality}`)
  }
  
  // 裁剪模式
  const cropMode = fit === 'cover' ? 'fill' : fit === 'contain' ? 'fit' : 'scale'
  transformations.push(`c_${cropMode}`)
  
  // 格式
  if (format !== 'auto') {
    transformations.push(`f_${format}`)
  } else {
    transformations.push('f_auto')
  }
  
  return `${baseUrl}${transformations.join(',')}/${imagePath}`
}

/**
 * 获取响应式图片 srcSet
 * 用于实现渐进式加载
 */
export function getResponsiveImageSrcSet(
  url: string,
  sizes: ImageSize[] = ['thumbnail', 'small', 'medium', 'large']
): string {
  if (!url) return ''
  
  const srcSetEntries = sizes.map(size => {
    const optimizedUrl = getOptimizedImageUrl(url, size)
    const width = sizeMap[size].width
    return `${optimizedUrl} ${width}w`
  })
  
  return srcSetEntries.join(', ')
}

/**
 * 获取图片加载策略
 * 根据网络状况和设备类型返回最佳加载策略
 */
export function getImageLoadingStrategy(
  index: number,
  isPriority: boolean = false
): {
  loading: 'eager' | 'lazy'
  priority: boolean
  sizes: string
} {
  // 首屏图片优先加载
  if (isPriority || index < 2) {
    return {
      loading: 'eager',
      priority: true,
      sizes: '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
    }
  }
  
  // 其他图片延迟加载
  return {
    loading: 'lazy',
    priority: false,
    sizes: '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
  }
}

/**
 * 生成模糊占位图 URL (用于渐进式加载)
 */
export function getBlurPlaceholderUrl(url: string): string {
  if (!url) return ''
  
  // Cloudinary 支持低质量占位图
  if (url.includes('cloudinary.com')) {
    return getCloudinaryOptimizedUrl(url, { width: 20, height: 20, quality: 10 }, 'auto', 'cover')
  }
  
  // MinIO 低质量占位图
  if (isMinIOUrl(url)) {
    return getMinIOOptimizedUrl(url, { width: 20, height: 20, quality: 10 }, 'auto', 'cover')
  }
  
  return url
}

/**
 * 预加载关键图片
 */
export function preloadImages(urls: string[]): void {
  if (typeof window === 'undefined') return
  
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}
