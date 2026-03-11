'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { InfiniteFeed } from './infinite-feed'
import { PostCardSkeleton } from './post-card-skeleton'
import Link from 'next/link'

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

interface ProfileTabsProps {
  userId: string
  currentUserId: string
  initialPosts: Post[]
  initialCursor: string | null
  isSelf: boolean
}

type TabType = 'posts' | 'saved' | 'liked'

export function ProfileTabs({
  userId,
  currentUserId,
  initialPosts,
  initialCursor,
  isSelf
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts')

  const tabs = [
    { id: 'posts' as const, label: '帖子' },
    { id: 'saved' as const, label: '收藏' },
    { id: 'liked' as const, label: '赞过' },
  ]

  const getApiEndpoint = () => {
    if (activeTab === 'saved') return `/api/users/${userId}/favorites`
    if (activeTab === 'liked') return `/api/users/${userId}/likes`
    return `/api/posts?userId=${userId}`
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="w-full bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1 mb-4">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'posts' && (
          <PostsTab
            initialPosts={initialPosts}
            initialCursor={initialCursor}
            currentUserId={currentUserId}
            isSelf={isSelf}
          />
        )}
        {activeTab === 'saved' && (
          <ApiFeedTab
            apiEndpoint={getApiEndpoint()}
            currentUserId={currentUserId}
            emptyMessage="还没有收藏任何内容"
            emptySubMessage={isSelf ? '看到喜欢的内容就收藏起来吧' : '该用户还没有收藏'}
          />
        )}
        {activeTab === 'liked' && (
          <ApiFeedTab
            apiEndpoint={getApiEndpoint()}
            currentUserId={currentUserId}
            emptyMessage="还没有点赞任何内容"
            emptySubMessage={isSelf ? '给喜欢的内容点个赞吧' : '该用户还没有点赞'}
          />
        )}
      </motion.div>
    </div>
  )
}

function PostsTab({
  initialPosts,
  initialCursor,
  currentUserId,
  isSelf
}: {
  initialPosts: Post[]
  initialCursor: string | null
  currentUserId: string
  isSelf: boolean
}) {
  if (initialPosts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
        <p className="text-lg mb-2">还没有发布任何内容</p>
        {isSelf && (
          <Link href="/post/new" className="text-purple-600 hover:underline">
            发布第一条动态 →
          </Link>
        )}
      </div>
    )
  }

  return (
    <InfiniteFeed
      initialPosts={initialPosts}
      initialCursor={initialCursor}
      currentUserId={currentUserId}
    />
  )
}

function ApiFeedTab({
  apiEndpoint,
  currentUserId,
  emptyMessage,
  emptySubMessage
}: {
  apiEndpoint: string
  currentUserId: string
  emptyMessage: string
  emptySubMessage: string
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{ posts: Post[]; nextCursor: string | null } | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${apiEndpoint}?limit=10`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Error fetching feed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [apiEndpoint])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    )
  }

  if (!data || data.posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
        <p className="text-lg mb-2">{emptyMessage}</p>
        <p className="text-sm text-gray-400">{emptySubMessage}</p>
      </div>
    )
  }

  return (
    <InfiniteFeed
      initialPosts={data.posts}
      initialCursor={data.nextCursor}
      currentUserId={currentUserId}
      apiEndpoint={apiEndpoint}
    />
  )
}
