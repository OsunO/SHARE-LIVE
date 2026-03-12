/**
 * 图片预加载策略
 * 
 * 实现智能预加载：
 * 1. 首屏图片优先加载
 * 2. 即将进入视口的图片预加载
 * 3. 用户可能查看的图片预加载 (如 Lightbox 中的下一张)
 */

import { getOptimizedImageUrl, ImageSize } from './image-utils'

interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto'
  size?: ImageSize
}

// 预加载单张图片
export function preloadImage(url: string, options: PreloadOptions = {}): Promise<void> {
  const { priority = 'auto', size = 'medium' } = options
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload: ${url}`))
    
    // 使用优化后的 URL
    img.src = getOptimizedImageUrl(url, size, { format: 'webp', fit: 'cover' })
    
    // 设置加载优先级
    if (priority === 'high') {
      img.fetchPriority = 'high'
    } else if (priority === 'low') {
      img.fetchPriority = 'low'
    }
  })
}

// 预加载多张图片
export async function preloadImages(
  urls: string[],
  options: PreloadOptions = {}
): Promise<void> {
  const promises = urls.map(url => preloadImage(url, options))
  await Promise.allSettled(promises)
}

// 顺序预加载 (用于 Lightbox 中的图片序列)
export async function preloadImagesSequential(
  urls: string[],
  options: PreloadOptions = {}
): Promise<void> {
  for (const url of urls) {
    try {
      await preloadImage(url, options)
    } catch (error) {
      console.warn('Failed to preload image:', url)
    }
  }
}

// 使用 Intersection Observer 的智能预加载
export class SmartImagePreloader {
  private observer: IntersectionObserver | null = null
  private pendingImages: Map<string, () => void> = new Map()
  private loadedImages: Set<string> = new Set()

  constructor(
    private rootMargin: string = '500px',
    private threshold: number = 0
  ) {
    if (typeof window !== 'undefined') {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: this.rootMargin,
          threshold: this.threshold
        }
      )
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const url = entry.target.getAttribute('data-src')
        if (url && !this.loadedImages.has(url)) {
          this.loadImage(url)
        }
        this.observer?.unobserve(entry.target)
      }
    })
  }

  private loadImage(url: string) {
    if (this.loadedImages.has(url)) return

    const img = new Image()
    img.onload = () => {
      this.loadedImages.add(url)
      this.pendingImages.get(url)?.()
      this.pendingImages.delete(url)
    }
    img.onerror = () => {
      this.pendingImages.delete(url)
    }
    img.src = url
  }

  // 添加图片到预加载队列
  observe(element: Element, url: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.loadedImages.has(url)) {
        resolve()
        return
      }

      this.pendingImages.set(url, resolve)
      element.setAttribute('data-src', url)
      this.observer?.observe(element)
    })
  }

  // 立即预加载 (不等待进入视口)
  preloadImmediate(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedImages.has(url)) {
        resolve()
        return
      }

      const img = new Image()
      img.onload = () => {
        this.loadedImages.add(url)
        resolve()
      }
      img.onerror = reject
      img.src = url
    })
  }

  // 预加载 Lightbox 相关图片
  preloadLightboxImages(images: string[], currentIndex: number) {
    // 预加载当前图片 (高优先级)
    if (images[currentIndex]) {
      this.preloadImmediate(getOptimizedImageUrl(images[currentIndex], 'large'))
    }

    // 预加载下一张 (中等优先级)
    if (images[currentIndex + 1]) {
      setTimeout(() => {
        this.preloadImmediate(getOptimizedImageUrl(images[currentIndex + 1], 'large'))
      }, 100)
    }

    // 预加载上一张 (低优先级)
    if (images[currentIndex - 1]) {
      setTimeout(() => {
        this.preloadImmediate(getOptimizedImageUrl(images[currentIndex - 1], 'large'))
      }, 200)
    }
  }

  // 清理
  disconnect() {
    this.observer?.disconnect()
    this.pendingImages.clear()
  }
}

// 全局预加载器实例
let globalPreloader: SmartImagePreloader | null = null

export function getGlobalPreloader(): SmartImagePreloader {
  if (!globalPreloader && typeof window !== 'undefined') {
    globalPreloader = new SmartImagePreloader()
  }
  return globalPreloader!
}

// Hook 风格的预加载
export function useImagePreload() {
  const preloader = getGlobalPreloader()

  return {
    preload: (url: string) => preloader.preloadImmediate(url),
    preloadLightbox: (images: string[], currentIndex: number) => 
      preloader.preloadLightboxImages(images, currentIndex),
    observe: (element: Element, url: string) => preloader.observe(element, url)
  }
}

// 预加载关键资源 (首屏)
export function preloadCriticalResources(urls: string[]): void {
  if (typeof window === 'undefined') return

  // 使用 requestIdleCallback 或 setTimeout 延迟非关键预加载
  const schedule = (window as any).requestIdleCallback || setTimeout

  schedule(() => {
    urls.forEach((url, index) => {
      // 前3张高优先级，其余低优先级
      const priority = index < 3 ? 'high' : 'low'
      
      setTimeout(() => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = url
        if (priority === 'high') {
          link.fetchPriority = 'high'
        }
        document.head.appendChild(link)
      }, index * 100)
    })
  })
}
