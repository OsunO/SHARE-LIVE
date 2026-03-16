'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'shimmer' | 'pulse' | 'none'
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'shimmer'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl'
  }
  
  const animationClasses = {
    shimmer: 'shimmer-gradient',
    pulse: 'animate-pulse bg-gray-200',
    none: ''
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

// Post card skeleton
export function PostCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 overflow-hidden"
    >
      {/* Author header */}
      <div className="p-4 flex items-center gap-3">
        <Skeleton variant="circular" width={44} height={44} />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" height={16} />
          <Skeleton width="20%" height={12} />
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-3 space-y-2">
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-3/4" />
      </div>
      
      {/* Image */}
      <div className="px-4 pb-3">
        <Skeleton variant="rounded" className="w-full aspect-square" />
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-100">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={60} height={32} />
        <Skeleton variant="rounded" width={60} height={32} />
      </div>
    </motion.div>
  )
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cover */}
      <Skeleton variant="rectangular" className="w-full h-64 md:h-80" />
      
      {/* Profile card */}
      <div className="relative -mt-20 mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start gap-4">
            <Skeleton variant="circular" width={128} height={128} className="ring-4 ring-white" />
            <div className="flex-1 space-y-3 pt-4">
              <Skeleton height={28} width="50%" />
              <Skeleton height={16} width="30%" />
              <div className="flex gap-4 pt-2">
                <Skeleton height={36} width={100} variant="rounded" />
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center flex-1">
                <Skeleton height={24} className="mx-auto w-12" />
                <Skeleton height={16} className="mx-auto w-10 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Notification skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-3/4" />
        <Skeleton height={12} className="w-1/2" />
      </div>
    </div>
  )
}

// Feed loading skeleton
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Grid skeleton for discover
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="aspect-[3/4]"
        >
          <Skeleton variant="rounded" className="w-full h-full" />
        </motion.div>
      ))}
    </div>
  )
}