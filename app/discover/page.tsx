'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, MapPin, Clock, Flame, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { TagCloud } from '@/components/discover/tag-cloud'
import { Navbar } from '@/components/navbar'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import Image from 'next/image'

interface Post {
  id: string
  content: string
  images: string[]
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

const filters = [
  { id: 'trending', label: '热门', icon: Flame, color: 'from-orange-500 to-red-500' },
  { id: 'latest', label: '最新', icon: Clock, color: 'from-blue-500 to-cyan-500' },
  { id: 'nearby', label: '附近', icon: MapPin, color: 'from-green-500 to-emerald-500' },
]

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] as const
    }
  }
}

export default function DiscoverPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('trending')
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  const fetchDiscoverContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/discover?filter=${activeFilter}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch discover content:', error)
      setError('加载失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDiscoverContent()
    }
  }, [activeFilter, status, fetchDiscoverContent])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleTagClick = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar user={(session?.user as any)?.id ? session?.user as any : { id: '', name: null, email: null, image: null }} />
      
      {/* Hero Section with Tag Cloud */}
      <section className="relative overflow-hidden pt-20 pb-12 px-4">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl"
          />
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-center mb-8"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              <span className="gradient-text-animated">发现精彩</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg md:text-xl"
            >
              探索标签，发现有趣的人和故事
            </motion.p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-6"
          >
            <motion.div 
              animate={{ 
                boxShadow: isSearchFocused 
                  ? '0 20px 50px -12px rgba(147, 51, 234, 0.25)' 
                  : '0 10px 30px -10px rgba(147, 51, 234, 0.15)'
              }}
              className="relative group rounded-2xl"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="搜索标签、用户或内容..."
                className="w-full px-6 py-4 pl-14 bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-transparent focus:border-purple-300/50 focus:outline-none transition-all duration-300"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all"
              >
                搜索
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Advanced Search Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-12"
          >
            <button
              onClick={() => router.push('/search')}
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors group"
            >
              使用高级搜索
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Tag Cloud */}
          <TagCloud onTagClick={handleTagClick} />
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {filters.map((filter, index) => {
              const Icon = filter.icon
              const isActive = activeFilter === filter.id
              return (
                <motion.button
                  key={filter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${filter.color} text-white shadow-lg shadow-purple-500/25`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  {filter.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Masonry Content Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl aspect-[3/4] shimmer-gradient"
                />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center"
              >
                <RefreshCw className="w-10 h-10 text-red-400" />
              </motion.div>
              <p className="text-red-500 mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchDiscoverContent}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25"
              >
                重试
              </motion.button>
            </motion.div>
          ) : posts.length > 0 ? (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={itemVariants}
                  className="break-inside-avoid"
                >
                  <DiscoverCard post={post} index={index} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full flex items-center justify-center shadow-lg"
              >
                <TrendingUp className="w-10 h-10 text-purple-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无内容</h3>
              <p className="text-gray-500">换个筛选条件试试看</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

function DiscoverCard({ post, index }: { post: Post; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      layout
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer"
    >
      {post.images[0] && (
        <div className="relative overflow-hidden">
          <motion.img
            src={post.images[0]}
            alt={post.content}
            onLoad={() => setImageLoaded(true)}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ 
              scale: isHovered ? 1.1 : 1, 
              opacity: imageLoaded ? 1 : 0 
            }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full object-cover"
            style={{ aspectRatio: '3/4' }}
          />
          
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 shimmer-gradient" />
          )}
          
          {/* Gradient overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          />
          
          {/* Hover Overlay Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-4 text-white"
          >
            <p className="text-sm line-clamp-2 mb-3 font-medium">{post.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                  <Flame className="w-3 h-3" />
                  {post._count.likes}
                </span>
                <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                  💬 {post._count.comments}
                </span>
              </div>
              {post.author.image && (
                <img 
                  src={post.author.image} 
                  alt={post.author.name || ''}
                  className="w-8 h-8 rounded-full border-2 border-white/50"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="p-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="px-2.5 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 text-xs rounded-full font-medium hover:from-purple-100 hover:to-pink-100 transition-colors"
            >
              #{tag}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
