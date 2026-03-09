'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PostCard } from './post-card'
import { PostCardSkeleton, EmptyState } from './post-card-skeleton'
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

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] as const
    }
  }
}

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
      { rootMargin: '150px' }
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

  const handleRetry = () => {
    setError(null)
    loadMorePosts()
  }

  // Empty state
  if (posts.length === 0 && !isLoading) {
    return (
      <EmptyState 
        message="还没有动态" 
        subMessage="关注更多用户，或发布你的第一条动态吧！"
      />
    )
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <AnimatePresence mode="popLayout">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            variants={itemVariants}
            layout
            transition={{ 
              layout: { duration: 0.3 },
              opacity: { duration: 0.3 },
              y: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
            }}
          >
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onLikeUpdate={handleLikeUpdate}
              onFavoriteUpdate={handleFavoriteUpdate}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <PostCardSkeleton />
            <PostCardSkeleton />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-8 px-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </motion.div>
            <p className="text-red-500 mb-4 font-medium">{error}</p>
            <motion.button 
              onClick={handleRetry}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Intersection Observer Target */}
      {hasMore && !error && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-6 h-6 text-purple-400" />
          </motion.div>
        </div>
      )}
      
      {/* End of Feed */}
      <AnimatePresence>
        {!hasMore && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300" />
              <span className="text-sm">已经到底了</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
