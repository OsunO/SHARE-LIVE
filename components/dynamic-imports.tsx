/**
 * 动态导入示例
 * 
 * 展示如何使用 Next.js 的动态导入来优化 bundle 大小
 */

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { motion } from 'framer-motion'

// 方式1: 基础动态导入
export const DynamicLightbox = dynamic(
  () => import('./image-lightbox').then(mod => ({ default: mod.ImageLightbox })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
        />
      </div>
    )
  }
)

// 方式2: 带预加载的动态导入
export const DynamicMasonryGrid = dynamic(
  () => import('./masonry-grid').then(mod => ({ default: mod.MasonryGrid })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }
)

// 方式3: 条件动态导入 (仅在需要时加载)
export function ConditionalDynamicImport({ 
  condition, 
  children 
}: { 
  condition: boolean
  children: React.ReactNode 
}) {
  if (!condition) return null
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full"
        />
      </div>
    }>
      {children}
    </Suspense>
  )
}

// 方式4: 交互触发的动态导入
export function useDynamicComponent<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (Component) return
    
    setIsLoading(true)
    try {
      const mod = await importFn()
      setComponent(() => mod.default)
    } finally {
      setIsLoading(false)
    }
  }, [importFn, Component])

  return { Component, isLoading, load }
}

// 使用示例
import { useState, useCallback } from 'react'

export function LazyLoadExample() {
  const [showHeavyComponent, setShowHeavyComponent] = useState(false)

  return (
    <div>
      <button 
        onClick={() => setShowHeavyComponent(true)}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg"
      >
        加载重型组件
      </button>
      
      {showHeavyComponent && (
        <Suspense fallback={<div>加载中...</div>}>
          {/* 这里放重型组件 */}
        </Suspense>
      )}
    </div>
  )
}

// 预加载策略
export function preloadComponent(importFn: () => Promise<any>) {
  // 使用 requestIdleCallback 在空闲时预加载
  const schedule = (window as any).requestIdleCallback || setTimeout
  
  schedule(() => {
    importFn()
  })
}

// 示例：预加载 Lightbox
export function preloadLightbox() {
  preloadComponent(() => import('./image-lightbox'))
}
