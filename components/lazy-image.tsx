'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedImageUrl, getBlurPlaceholderUrl, ImageSize } from '@/lib/image-utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'video' | 'auto'
  priority?: boolean
  size?: ImageSize
  onLoad?: () => void
  onError?: () => void
}

const aspectRatioClasses = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  video: 'aspect-video',
  auto: ''
}

export function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
  priority = false,
  size = 'medium',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const imageRef = useRef<HTMLDivElement>(null)
  const imgElementRef = useRef<HTMLImageElement>(null)

  // 生成优化后的图片 URL
  const optimizedSrc = useCallback(() => {
    if (!src) return ''
    return getOptimizedImageUrl(src, size, { format: 'webp', fit: 'cover' })
  }, [src, size])

  const blurPlaceholder = useCallback(() => {
    if (!src) return ''
    return getBlurPlaceholderUrl(src)
  }, [src])

  // Intersection Observer 检测图片是否进入视口
  useEffect(() => {
    if (priority || !imageRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px',
        threshold: 0
      }
    )

    observer.observe(imageRef.current)

    return () => observer.disconnect()
  }, [priority])

  // 当图片进入视口时，加载实际图片
  useEffect(() => {
    if (isInView && !currentSrc) {
      // 先加载模糊占位图
      const placeholder = blurPlaceholder()
      if (placeholder && placeholder !== src) {
        setCurrentSrc(placeholder)
      }
      
      // 然后加载优化后的实际图片
      const optimized = optimizedSrc()
      if (optimized) {
        const img = new Image()
        img.onload = () => {
          setCurrentSrc(optimized)
        }
        img.onerror = () => {
          // 如果优化图片加载失败，尝试原图
          if (src !== optimized) {
            setCurrentSrc(src)
          } else {
            handleError()
          }
        }
        img.src = optimized
      }
    }
  }, [isInView, src, optimizedSrc, blurPlaceholder, currentSrc])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // 计算是否是低质量占位图
  const isPlaceholder = currentSrc === blurPlaceholder() && currentSrc !== optimizedSrc()

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden bg-gray-100 ${aspectRatioClasses[aspectRatio]} ${className}`}
    >
      {/* Skeleton Loader - 显示直到图片加载完成 */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"
          >
            {/* 脉冲动画 */}
            <div className="absolute inset-0 animate-pulse">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">加载失败</span>
          </div>
        </div>
      )}

      {/* Actual Image - 渐进式加载 */}
      {isInView && !hasError && currentSrc && (
        <motion.img
          ref={imgElementRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0, filter: isPlaceholder ? 'blur(20px)' : 'blur(10px)' }}
          animate={{
            opacity: isLoaded ? 1 : 0.7,
            filter: isLoaded ? 'blur(0px)' : isPlaceholder ? 'blur(20px)' : 'blur(10px)',
            scale: isLoaded ? 1 : isPlaceholder ? 1.05 : 1
          }}
          transition={{ 
            duration: isPlaceholder ? 0.3 : 0.5, 
            ease: 'easeOut' 
          }}
          className="w-full h-full object-cover"
          style={{
            imageRendering: isPlaceholder ? 'auto' : 'auto'
          }}
        />
      )}

      {/* 占位符模糊效果叠加层 */}
      {!isLoaded && isInView && !hasError && isPlaceholder && (
        <div className="absolute inset-0 backdrop-blur-md bg-white/5" />
      )}
    </div>
  )
}
