'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { InfiniteFeed } from '@/components/infinite-feed'
import { Navbar } from '@/components/navbar'
import { StoriesBar } from '@/components/stories/StoriesBar'
import { FloatingActionButton } from '@/components/floating-action-button'
import { QuickFilter } from '@/components/quick-filter'
import { Sparkles, TrendingUp, Users, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

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

interface FeedData {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

type FeedType = 'latest' | 'popular' | 'following'

const POSTS_PER_PAGE = 10

// Get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// Get random tagline
function getTagline(): string {
  const taglines = [
    '分享你的生活，连接有趣的人',
    '记录美好瞬间，留住珍贵回忆',
    '发现精彩，从这里开始',
    '每一个瞬间都值得被分享',
    '与世界分享你的故事',
  ]
  return taglines[Math.floor(Math.random() * taglines.length)]
}

export default function Home() {
  const { data: session, status } = useSession()
  const [activeFilter, setActiveFilter] = useState<FeedType>('latest')
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  // Fetch feed data based on active filter
  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchFeed = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let endpoint = '/api/posts'
        if (activeFilter === 'following') {
          endpoint = '/api/posts/feed'
        } else if (activeFilter === 'popular') {
          endpoint = '/api/posts?sort=popular'
        }

        const response = await fetch(`${endpoint}?limit=${POSTS_PER_PAGE}`)
        if (!response.ok) {
          throw new Error('Failed to fetch feed')
        }

        const data = await response.json()
        setFeedData({
          posts: data.posts.map((post: Post) => ({
            ...post,
            createdAt: typeof post.createdAt === 'string' 
              ? post.createdAt 
              : new Date(post.createdAt).toISOString()
          })),
          nextCursor: data.nextCursor,
          hasMore: data.hasMore
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeed()
  }, [activeFilter, status])

  const getApiEndpoint = () => {
    if (activeFilter === 'following') return '/api/posts/feed'
    if (activeFilter === 'popular') return '/api/posts?sort=popular'
    return '/api/posts'
  }

  const greeting = getGreeting()
  const tagline = getTagline()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={session?.user || { id: '', name: null, email: null, image: null }} />
      
      {/* Stories Bar */}
      <div className="pt-16">
        <StoriesBar />
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-8 px-4 sm:pt-8 sm:pb-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-2xl mx-auto">
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              <span className="text-gray-800">{greeting}，</span>
              <span className="gradient-text">{session?.user?.name || '朋友'}</span>
              <span className="inline-block animate-bounce-soft ml-1">👋</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base animate-slide-up">
              {tagline}
            </p>
          </div>

          {/* Quick Stats / Filters */}
          <div className="flex justify-center gap-3 sm:gap-4 mt-6 animate-slide-up">
            <button onClick={() => setActiveFilter('latest')}>
              <QuickFilter 
                iconName="Sparkles" 
                label="新鲜事" 
                color="purple" 
                active={activeFilter === 'latest'} 
              />
            </button>
            <button onClick={() => setActiveFilter('popular')}>
              <QuickFilter 
                iconName="TrendingUp" 
                label="热门" 
                color="pink" 
                active={activeFilter === 'popular'} 
              />
            </button>
            <button onClick={() => setActiveFilter('following')}>
              <QuickFilter 
                iconName="Users" 
                label="关注" 
                color="blue" 
                active={activeFilter === 'following'} 
              />
            </button>
            <QuickFilter 
              iconName="Compass" 
              label="发现" 
              color="indigo" 
              href="/discover" 
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-3 sm:px-4 pb-24">
        {/* New Post Button - Mobile */}
        <div className="sm:hidden mb-4 animate-scale-in">
          <a
            href="/post/new"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            发布新动态
          </a>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </motion.div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              重试
            </button>
          </div>
        ) : feedData ? (
          <InfiniteFeed 
            initialPosts={feedData.posts}
            initialCursor={feedData.nextCursor}
            currentUserId={session?.user?.id || ''}
            apiEndpoint={getApiEndpoint()}
          />
        ) : null}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  )
}
