'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { PostCard } from './post-card'
import { PostCardSkeleton } from './post-card-skeleton'

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

interface FeedResponse {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

interface InfiniteFeedProps {
  initialPosts: Post[]
  initialCursor: string | null
  currentUserId: string
}

const POSTS_PER_PAGE = 10

export function InfiniteFeed({ initialPosts, initialCursor, currentUserId }: InfiniteFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/posts?cursor=${cursor}&limit=${POSTS_PER_PAGE}`)
      
      if (!response.ok) {
        throw new Error('Failed to load more posts')
      }
      
      const data: FeedResponse = await response.json()
      
      setPosts(prev => [...prev, ...data.posts])
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [cursor, hasMore, isLoading])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts()
        }
      },
      { rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMorePosts])

  const handleLikeUpdate = (postId: string, liked: boolean, likeCount: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: liked 
            ? [...post.likes, { id: 'temp' }]
            : post.likes.filter(l => l.id !== 'temp'),
          _count: {
            ...post._count,
            likes: likeCount
          }
        }
      }
      return post
    }))
  }

  const handleFavoriteUpdate = (postId: string, favorited: boolean) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          favorites: favorited
            ? [...post.favorites, { id: 'temp' }]
            : post.favorites.filter(f => f.id !== 'temp')
        }
      }
      return post
    }))
  }

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLikeUpdate={handleLikeUpdate}
          onFavoriteUpdate={handleFavoriteUpdate}
        />
      ))}
      
      {/* Loading State */}
      {isLoading && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={loadMorePosts}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      )}
      
      {/* Intersection Observer Target */}
      {hasMore && !error && (
        <div ref={loadMoreRef} className="py-4" />
      )}
      
      {/* End of Feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          已经到底了，没有更多内容了
        </div>
      )}
    </div>
  )
}
