'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  content: string
  images: string[]
  createdAt: Date
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

interface FeedProps {
  posts: Post[]
  currentUserId: string
}

export function Feed({ posts, currentUserId }: FeedProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(posts.filter(p => p.likes.length > 0).map(p => p.id))
  )
  const [favoritePosts, setFavoritePosts] = useState<Set<string>>(
    new Set(posts.filter(p => p.favorites.length > 0).map(p => p.id))
  )
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(posts.map(p => [p.id, p._count.likes]))
  )

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLikedPosts(prev => {
          const next = new Set(prev)
          if (data.liked) {
            next.add(postId)
          } else {
            next.delete(postId)
          }
          return next
        })
        setLikeCounts(prev => ({
          ...prev,
          [postId]: data.likeCount
        }))
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const handleFavorite = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/favorite`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFavoritePosts(prev => {
          const next = new Set(prev)
          if (data.favorited) {
            next.add(postId)
          } else {
            next.delete(postId)
          }
          return next
        })
      }
    } catch (error) {
      console.error('Favorite error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <article key={post.id} className="bg-white rounded-lg shadow-sm border">
          {/* Author Header */}
          <div className="p-4 flex items-center gap-3">
            <Link href={`/profile/${post.author.id}`}>
              {post.author.image ? (
                <img 
                  src={post.author.image} 
                  alt={post.author.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">
                    {post.author.name?.[0] || 'U'}
                  </span>
                </div>
              )}
            </Link>
            <div className="flex-1">
              <Link 
                href={`/profile/${post.author.id}`}
                className="font-medium hover:underline"
              >
                {post.author.name || '匿名用户'}
              </Link>
              <p className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Images */}
          {post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-1">
              {post.images.map((image, idx) => (
                <img
                  key={idx}
                  src={image}
                  alt={`Post image ${idx + 1}`}
                  className="w-full aspect-square object-cover"
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="p-4 flex items-center gap-6">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-2 transition-colors ${
                likedPosts.has(post.id) 
                  ? 'text-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart 
                className={`w-6 h-6 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} 
              />
              <span>{likeCounts[post.id] || 0}</span>
            </button>

            <Link 
              href={`/post/${post.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span>{post._count.comments}</span>
            </Link>

            <button
              onClick={() => handleFavorite(post.id)}
              className={`flex items-center gap-2 transition-colors ${
                favoritePosts.has(post.id)
                  ? 'text-yellow-500'
                  : 'text-gray-600 hover:text-yellow-500'
              }`}
            >
              <Bookmark 
                className={`w-6 h-6 ${favoritePosts.has(post.id) ? 'fill-current' : ''}`}
              />
            </button>

            <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors ml-auto">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
