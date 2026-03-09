'use client'

import { motion } from 'framer-motion'

export function PostCardSkeleton() {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Author Header Skeleton */}
      <div className="p-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shimmer-gradient" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-28 shimmer-gradient" />
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16 shimmer-gradient" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-3 space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full shimmer-gradient" />
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 shimmer-gradient" />
      </div>

      {/* Image Skeleton - Grid layout */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shimmer-gradient" />
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shimmer-gradient" />
      </div>

      {/* Actions Skeleton */}
      <div className="p-4 flex items-center gap-6 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 shimmer-gradient" />
          <div className="h-5 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg shimmer-gradient" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 shimmer-gradient" />
          <div className="h-5 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg shimmer-gradient" />
        </div>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 shimmer-gradient ml-auto" />
      </div>
    </motion.article>
  )
}

// Empty state component
export function EmptyState({ message = "暂无内容", subMessage }: { message?: string; subMessage?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-16 px-4"
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/10"
      >
        <svg 
          className="w-12 h-12 text-purple-400" 
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
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{message}</h3>
      {subMessage && <p className="text-gray-500">{subMessage}</p>}
    </motion.div>
  )
}
