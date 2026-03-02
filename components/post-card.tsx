'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from 'lucide-react'
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

export function PostCard({ post, currentUserId, onLikeUpdate, onFavoriteUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.likes.length > 0)
  const [isFavorited, setIsFavorited] = useState(post.favorites.length > 0)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleLike = async () => {
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
  }

  const handleFavorite = async () => {
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
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
  }

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Author Header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${post.author.id}`} className="relative group">
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
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base">
            {post.content}
          </p>
        </div>
      )}

      {/* Images - Enhanced Grid with Lazy Loading */}
      {post.images.length > 0 && (
        <div className={`grid gap-1 sm:gap-2 px-4 pb-3 ${
          post.images.length === 1 ? 'grid-cols-1' : 
          post.images.length === 2 ? 'grid-cols-2' : 
          'grid-cols-2'
        }`}>
          {post.images.slice(0, 4).map((image, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className={`relative overflow-hidden rounded-lg cursor-pointer group ${
                post.images.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
              } ${idx === 0 && post.images.length > 2 ? 'row-span-2' : ''}`}
            >
              <LazyImage
                src={image}
                alt={`图片 ${idx + 1}`}
                aspectRatio={post.images.length === 1 ? 'landscape' : 'square'}
                priority={idx === 0}
                className="w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              
              {idx === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl font-bold">+{post.images.length - 4}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <motion.button
            onClick={handleLike}
            disabled={isLikeLoading}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
              isLiked 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isLiked ? 'liked' : 'unliked'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Heart 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isLiked ? 'fill-current' : ''} ${isLikeLoading ? 'animate-pulse' : ''}`} 
                />
              </motion.div>
            </AnimatePresence>
            <span className="font-semibold text-sm sm:text-base min-w-[1rem]">{likeCount > 0 ? likeCount : ''}</span>
          </motion.button>

          {/* Comment Button */}
          <Link 
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-semibold text-sm sm:text-base min-w-[1rem]">{post._count.comments > 0 ? post._count.comments : ''}</span>
          </Link>

          {/* Favorite Button */}
          <motion.button
            onClick={handleFavorite}
            disabled={isFavoriteLoading}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
              isFavorited 
                ? 'text-yellow-500 bg-yellow-50' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bookmark 
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isFavorited ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`}
            />
          </motion.button>
        </div>

        {/* Share Button */}
        <div className="relative">
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-600 hover:bg-green-50 hover:text-green-500 transition-all"
          >
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
          
          {/* Share Menu */}
          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[140px] z-10"
              >
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  复制链接
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  分享到微信
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  分享到微博
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  )
}
