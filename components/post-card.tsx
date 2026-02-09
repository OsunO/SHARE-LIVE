'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Author Header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${post.author.id}`}>
          {post.author.image ? (
            <img 
              src={post.author.image} 
              alt={post.author.name || 'User'} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
              {post.author.name?.[0] || 'U'}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            href={`/profile/${post.author.id}`} 
            className="font-medium text-gray-900 hover:underline truncate block"
          >
            {post.author.name || '匿名用户'}
          </Link>
          <p className="text-sm text-gray-500">
            {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Images - Pinterest Style Grid */}
      {post.images.length > 0 && (
        <div className={`grid gap-1 ${
          post.images.length === 1 ? 'grid-cols-1' : 
          post.images.length === 2 ? 'grid-cols-2' : 
          'grid-cols-2'
        }`}>
          {post.images.slice(0, 4).map((image, idx) => (
            <div 
              key={idx} 
              className={`relative ${
                post.images.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
              } ${idx === 0 && post.images.length > 2 ? 'row-span-2' : ''}`}
            >
              <img 
                src={image} 
                alt={`图片 ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {idx === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center gap-6 border-t border-gray-50">
        <button
          onClick={handleLike}
          disabled={isLikeLoading}
          className={`flex items-center gap-2 transition-all ${
            isLiked 
              ? 'text-red-500 scale-105' 
              : 'text-gray-600 hover:text-red-500 hover:scale-105'
          }`}
        >
          <Heart 
            className={`w-6 h-6 transition-all ${isLiked ? 'fill-current' : ''} ${isLikeLoading ? 'animate-pulse' : ''}`} 
          />
          <span className="font-medium">{likeCount}</span>
        </button>

        <Link 
          href={`/post/${post.id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="font-medium">{post._count.comments}</span>
        </Link>

        <button
          onClick={handleFavorite}
          disabled={isFavoriteLoading}
          className={`flex items-center gap-2 transition-all ${
            isFavorited 
              ? 'text-yellow-500 scale-105' 
              : 'text-gray-600 hover:text-yellow-500 hover:scale-105'
          }`}
        >
          <Bookmark 
            className={`w-6 h-6 transition-all ${isFavorited ? 'fill-current' : ''} ${isFavoriteLoading ? 'animate-pulse' : ''}`}
          />
        </button>

        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors ml-auto">
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </article>
  )
}
