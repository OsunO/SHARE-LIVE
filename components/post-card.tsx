'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { LazyImage } from './lazy-image'
import { motion, AnimatePresence } from 'framer-motion'

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

interface PostCardProps {
  post: Post
  currentUserId: string
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void
  onFavoriteUpdate?: (postId: string, favorited: boolean) => void
}

// Optimized image grid layout based on image count
function ImageGrid({ images, postId }: { images: string[]; postId: string }) {
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-2 grid-rows-2'
      case 4:
        return 'grid-cols-2 grid-rows-2'
      default:
        return 'grid-cols-2 grid-rows-2'
    }
  }

  const getImageSpan = (index: number) => {
    if (images.length === 3 && index === 0) {
      return 'row-span-2'
    }
    return ''
  }

  const getAspectRatio = () => {
    switch (images.length) {
      case 1:
        return 'landscape' as const
      case 2:
        return 'square' as const
      case 3:
        return 'square' as const
      default:
        return 'square' as const
    }
  }

  // 根据图片数量和位置决定使用什么尺寸
  const getImageSize = (idx: number, totalImages: number): 'thumbnail' | 'small' | 'medium' => {
    // 首图使用中等尺寸
    if (idx === 0) return 'medium'
    // 其他图片使用小尺寸
    if (totalImages <= 2) return 'medium'
    return 'small'
  }

  return (
    <div className={`grid gap-1.5 sm:gap-2 ${getGridClass()}`}>
      {images.slice(0, 4).map((image, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className={`relative overflow-hidden rounded-xl cursor-pointer group ${getImageSpan(idx)}`}
        >
          <Link href={`/post/${postId}?image=${idx}`}>
            <LazyImage
              src={image}
              alt={`图片 ${idx + 1}`}
              aspectRatio={images.length === 1 ? 'landscape' : 'square'}
              priority={idx === 0}
              size={getImageSize(idx, images.length)}
              className="w-full h-full transition-all duration-500 group-hover:scale-105"
            />
            {/* Hover overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          
          {idx === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <span className="text-white text-xl sm:text-2xl font-bold">+{images.length - 4}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Like button with particle effect
function LikeButton({ 
  isLiked, 
  likeCount, 
  isLoading, 
  onClick 
}: { 
  isLiked: boolean
  likeCount: number
  isLoading: boolean
  onClick: () => void
}) {
  const [showParticles, setShowParticles] = useState(false)

  const handleClick = () => {
    if (!isLiked) {
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 600)
    }
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      whileTap={{ scale: 0.85 }}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
        isLiked 
          ? 'text-red-500 bg-red-50' 
          : 'text-gray-600 hover:bg-red-50 hover:text-red-400'
      }`}
    >
      {/* Particle effects */}
      <AnimatePresence>
        {showParticles && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos(i * 60 * Math.PI / 180) * 25,
                  y: Math.sin(i * 60 * Math.PI / 180) * 25,
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-red-500 pointer-events-none"
                style={{ marginLeft: '-3px', marginTop: '-3px' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={isLiked ? 'liked' : 'unliked'}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 45 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Heart 
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isLiked ? 'fill-current' : ''} ${isLoading ? 'animate-pulse' : ''} ${showParticles ? 'animate-heart-beat' : ''}`} 
          />
        </motion.div>
      </AnimatePresence>
      <motion.span 
        key={likeCount}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-semibold text-sm sm:text-base min-w-[1rem]"
      >
        {likeCount > 0 ? likeCount : ''}
      </motion.span>
    </motion.button>
  )
}

// Share menu with enhanced animation
function ShareMenu({ postId }: { postId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOptions = [
    { label: copied ? '已复制!' : '复制链接', action: handleCopyLink, icon: '🔗' },
    { label: '分享到微信', action: () => {}, icon: '💬' },
    { label: '分享到微博', action: () => {}, icon: '📱' },
  ]

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-600 hover:bg-green-50 hover:text-green-500 transition-all"
      >
        <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-[160px] z-50 overflow-hidden"
            >
              {shareOptions.map((option, index) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    option.action()
                    if (!option.label.includes('复制')) setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{option.icon}</span>
                  <span className={option.label.includes('已复制') ? 'text-green-600 font-medium' : ''}>
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Expandable content component
function ExpandableContent({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = content.length > 150

  if (!shouldTruncate) {
    return <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base">{content}</p>
  }

  return (
    <div>
      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base">
        {isExpanded ? content : content.slice(0, 150) + '...'}
      </p>
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.95 }}
        className="mt-2 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
      >
        {isExpanded ? (
          <>收起 <ChevronUp className="w-4 h-4" /></>
        ) : (
          <>展开更多 <ChevronDown className="w-4 h-4" /></>
        )}
      </motion.button>
    </div>
  )
}

export function PostCard({ post, currentUserId, onLikeUpdate, onFavoriteUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.likes.length > 0)
  const [isFavorited, setIsFavorited] = useState(post.favorites.length > 0)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)

  const handleLike = useCallback(async () => {
    if (isLikeLoading) return
    
    setIsLikeLoading(true)
    
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
        onLikeUpdate?.(post.id, data.liked, data.likeCount)
      }
    } catch (error) {
      console.error('Like error:', error)
    } finally {
      setIsLikeLoading(false)
    }
  }, [isLikeLoading, post.id, onLikeUpdate])

  const handleFavorite = useCallback(async () => {
    if (isFavoriteLoading) return
    
    setIsFavoriteLoading(true)
    
    try {
      const response = await fetch(`/api/posts/${post.id}/favorite`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.favorited)
        onFavoriteUpdate?.(post.id, data.favorited)
      }
    } catch (error) {
      console.error('Favorite error:', error)
    } finally {
      setIsFavoriteLoading(false)
    }
  }, [isFavoriteLoading, post.id, onFavoriteUpdate])

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 card-shine"
    >
      {/* Author Header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${post.author.id}`} className="relative group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {post.author.image ? (
              <img 
                src={post.author.image} 
                alt={post.author.name || 'User'} 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-purple-100 group-hover:ring-purple-300 transition-all"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center text-white font-medium text-lg">
                {post.author.name?.[0] || 'U'}
              </div>
            )}
          </motion.div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            href={`/profile/${post.author.id}`} 
            className="font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate block"
          >
            {post.author.name || '匿名用户'}
          </Link>
          <p className="text-xs sm:text-sm text-gray-500">
            {formatDate(post.createdAt)}
          </p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </motion.button>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <ExpandableContent content={post.content} />
        </div>
      )}

      {/* Images - Enhanced Grid with Lazy Loading */}
      {post.images.length > 0 && (
        <div className="px-4 pb-3">
          <ImageGrid images={post.images} postId={post.id} />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <LikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            isLoading={isLikeLoading}
            onClick={handleLike}
          />

          {/* Comment Button */}
          <Link 
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all group"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm sm:text-base min-w-[1rem]">{post._count.comments > 0 ? post._count.comments : ''}</span>
          </Link>

          {/* Favorite Button */}
          <motion.button
            onClick={handleFavorite}
            disabled={isFavoriteLoading}
            whileTap={{ scale: 0.85 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
              isFavorited 
                ? 'text-yellow-500 bg-yellow-50' 
                : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-500'
            }`}
          >
            <Bookmark 
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isFavorited ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`}
            />
          </motion.button>
        </div>

        {/* Share Button */}
        <ShareMenu postId={post.id} />
      </div>
    </motion.article>
  )
}
