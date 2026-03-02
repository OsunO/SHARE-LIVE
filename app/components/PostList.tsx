'use client'

import { useState, useCallback } from 'react'
import { useInfiniteScroll } from '@/app/hooks/useInfiniteScroll'
import { PostCard } from '@/components/post-card'
import { Loader2, RefreshCw } from 'lucide-react'

interface Post {
  id: string
  content: string
  images: string[]
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  _count: {
    likes: number
    comments: number
    favorites: number
  }
  likes: { id: string }[]
  favorites: { id: string }[]
}

interface PostListProps {
  initialPosts: Post[]
  initialCursor: string | null
  currentUserId: string
  apiEndpoint?: string
}

export function PostList({
  initialPosts,
  initialCursor,
  currentUserId,
  apiEndpoint = '/api/posts'
}: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(initialPosts.length === 10)

  const loadMore = useCallback(async () => {
    if (isLoading || !cursor) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${apiEndpoint}?cursor=${cursor}&limit=10`,
        { cache: 'no-store' }
      )

      if (!res.ok) {
        throw new Error('Failed to load more posts')
      }

      const data = await res.json()

      if (data.posts.length === 0) {
        setHasMore(false)
      } else {
        setPosts((prev) => [...prev, ...data.posts])
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [cursor, isLoading, apiEndpoint])

  const { setLoadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading
  })

  const handleRetry = () => {
    setError(null)
    loadMore()
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无动态
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
        />
      ))}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </div>
      )}

      {/* No More Posts */}
      {!hasMore && !isLoading && !error && posts.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          没有更多动态了
        </div>
      )}

      {/* Intersection Observer Target */}
      {hasMore && <div ref={setLoadMoreRef} className="h-4" />}
    </div>
  )
}
