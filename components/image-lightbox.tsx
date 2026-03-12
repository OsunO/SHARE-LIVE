'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { LazyImage } from './lazy-image'
import { getOptimizedImageUrl } from '@/lib/image-utils'
import { useImagePreload } from '@/lib/image-preload'

interface ImageLightboxProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  postId?: string
}

export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
  postId
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const { preloadLightbox } = useImagePreload()

  // 重置状态当打开时
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setScale(1)
      setDragOffset({ x: 0, y: 0 })
      // 预加载 Lightbox 相关图片
      preloadLightbox(images, initialIndex)
    }
  }, [isOpen, initialIndex, images, preloadLightbox])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrev()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'ArrowUp':
          zoomIn()
          break
        case 'ArrowDown':
          zoomOut()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setScale(1)
      setDragOffset({ x: 0, y: 0 })
    }
  }, [currentIndex, images.length])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setScale(1)
      setDragOffset({ x: 0, y: 0 })
    }
  }, [currentIndex])

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3))
  }

  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1)
      if (newScale === 1) {
        setDragOffset({ x: 0, y: 0 })
      }
      return newScale
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }

  const handleDownload = async () => {
    const currentImage = images[currentIndex]
    if (!currentImage) return

    try {
      const response = await fetch(currentImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]
  const optimizedImage = getOptimizedImageUrl(currentImage, 'large', { format: 'webp', fit: 'contain' })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* 顶部工具栏 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent"
          >
            <div className="flex items-center gap-4 text-white/80">
              <span className="text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
              {postId && (
                <span className="text-xs text-white/50">
                  帖子 #{postId.slice(0, 8)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* 缩放控制 */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); zoomOut() }}
                disabled={scale <= 1}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </motion.button>
              <span className="text-sm text-white/70 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); zoomIn() }}
                disabled={scale >= 3}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </motion.button>

              {/* 下载按钮 */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleDownload() }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
              >
                <Download className="w-5 h-5" />
              </motion.button>

              {/* 关闭按钮 */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>

          {/* 主图片区域 */}
          <div
            className="absolute inset-0 flex items-center justify-center p-16"
            onClick={onClose}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: scale,
                x: dragOffset.x,
                y: dragOffset.y
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative max-w-full max-h-full cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={optimizedImage}
                alt={`图片 ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* 左右导航按钮 */}
          {images.length > 1 && (
            <>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: currentIndex > 0 ? 1 : 0.3, x: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); goToPrev() }}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: currentIndex < images.length - 1 ? 1 : 0.3, x: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </motion.button>
            </>
          )}

          {/* 底部缩略图栏 */}
          {images.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent"
            >
              <div className="flex items-center justify-center gap-2 max-w-full overflow-x-auto pb-2 scrollbar-hide">
                {images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex(index)
                      setScale(1)
                      setDragOffset({ x: 0, y: 0 })
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(image, 'thumbnail', { format: 'webp', fit: 'cover' })}
                      alt={`缩略图 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 操作提示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none"
          >
            ← → 切换 | ↑ ↓ 缩放 | ESC 关闭 | 滚轮缩放
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for using lightbox
export function useLightbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [initialIndex, setInitialIndex] = useState(0)
  const [postId, setPostId] = useState<string>()

  const openLightbox = useCallback((imgs: string[], index: number, pid?: string) => {
    setImages(imgs)
    setInitialIndex(index)
    setPostId(pid)
    setIsOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    images,
    initialIndex,
    postId,
    openLightbox,
    closeLightbox
  }
}
