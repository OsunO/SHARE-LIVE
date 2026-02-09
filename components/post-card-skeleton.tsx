'use client'

export function PostCardSkeleton() {
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Author Header Skeleton */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      </div>

      {/* Image Skeleton */}
      <div className="grid grid-cols-2 gap-1">
        <div className="aspect-square bg-gray-200 animate-pulse" />
        <div className="aspect-square bg-gray-200 animate-pulse" />
      </div>

      {/* Actions Skeleton */}
      <div className="p-4 flex items-center gap-6 border-t border-gray-50">
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-10 animate-pulse ml-auto" />
      </div>
    </article>
  )
}
